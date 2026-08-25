import { createHash } from 'node:crypto';
import { connectDb, disconnectDb } from '../config/db';
import { env } from '../config/env';
import { hashPassword } from '../utils/password';
import {
  ActivityLog,
  AIConversation,
  Enquiry,
  Lease,
  Listing,
  ListingView,
  Notification,
  Payment,
  Property,
  RentObligation,
  SavedListing,
  TeamMembership,
  Tenant,
  Unit,
  User,
  type LeaseDoc,
  type ListingDoc,
  type PropertyDoc,
  type TenantDoc,
  type UnitDoc,
  type UserDoc,
} from '../models';
import { recomputeRiskDeterministic } from '../ai/risk';
import { createLease, logPayment } from '../services/ledger';
import { recomputePropertyStatus } from '../services/occupancy';
import { ensureListingsForProperty } from '../services/listingProjection';
import { summaryNumbers } from '../services/stats';
import { withTxn } from '../utils/withTxn';
import {
  DEMO_LEASES,
  DEMO_PROPERTIES,
  DEMO_TENANTS,
  DEMO_UNITS,
  type DemoLeaseSpec,
} from './demoData';

export const DEMO_EMAILS = {
  landlord: 'landlord@example.com',
  tenant: 'tenant@example.com',
  caretaker: 'caretaker@example.com',
} as const;

/** Pure guard (§12) — never seed in production; guarded outside dev/test. Testable. */
export function assertSeedAllowed(nodeEnv: string, seedAllow: boolean): void {
  if (nodeEnv === 'production')
    throw new Error('Refusing to seed in production (NODE_ENV=production).');
  if (nodeEnv !== 'test' && nodeEnv !== 'development' && !seedAllow) {
    throw new Error('Seeding is guarded. Set SEED_ALLOW=1 to proceed.');
  }
  if (nodeEnv === 'development' && !seedAllow) {
    throw new Error('Seeding in development requires SEED_ALLOW=1.');
  }
}

async function ensureUser(
  email: string,
  values: { fullName: string; role: 'landlord' | 'tenant' | 'caretaker' },
  password: string,
): Promise<UserDoc> {
  const existing = await User.findOne({ email });
  if (existing) {
    existing.fullName = values.fullName;
    existing.role = values.role;
    existing.isVerified = true;
    existing.isDisabled = false;
    await existing.save(); // deliberately leaves the existing password hash untouched
    return existing;
  }
  return User.create({
    ...values,
    email,
    password: await hashPassword(password),
    isVerified: true,
  });
}

async function ensureProperty(landlord: UserDoc, specIndex: number): Promise<PropertyDoc> {
  const spec = DEMO_PROPERTIES[specIndex]!;
  const property = await Property.findOneAndUpdate(
    { landlordId: landlord._id, propertyTitle: spec.propertyTitle },
    {
      $set: {
        address: spec.address,
        area: spec.area,
        lga: spec.lga,
        propertyType: spec.propertyType,
        description: spec.description,
        images: spec.images,
        hasUnits: Boolean(spec.hasUnits),
        bedrooms: spec.bedrooms,
        bathrooms: spec.bathrooms,
        sizeSqm: spec.sizeSqm,
        amenities: spec.amenities,
        paymentFrequency: 'annual',
        rentAmount: spec.rentAmount,
        verified: Boolean(spec.verified),
      },
      $setOnInsert: { landlordId: landlord._id, statusCache: 'vacant' },
      $unset: { archivedAt: 1 },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  if (!property) throw new Error(`Could not seed property ${spec.propertyTitle}`);
  return property;
}

async function ensureUnit(property: PropertyDoc, specIndex: number): Promise<UnitDoc> {
  const spec = DEMO_UNITS[specIndex]!;
  const unit = await Unit.findOneAndUpdate(
    { propertyId: property._id, unitNumber: spec.label },
    {
      $set: {
        bedrooms: spec.bedrooms,
        bathrooms: spec.bathrooms,
        floor: spec.floor,
        sizeSqm: spec.sizeSqm,
        rentAmount: spec.rentAmount,
        paymentFrequency: 'annual',
        amenities: ['water', 'parking', 'security', 'kitchen'],
        images: spec.images,
      },
      $setOnInsert: { propertyId: property._id, unitNumber: spec.label, statusCache: 'vacant' },
      $unset: { archivedAt: 1 },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  if (!unit) throw new Error(`Could not seed unit ${spec.label}`);
  return unit;
}

async function ensureTenant(
  landlord: UserDoc,
  marketplaceUser: UserDoc,
  specIndex: number,
): Promise<TenantDoc> {
  const spec = DEMO_TENANTS[specIndex]!;
  const tenant = await Tenant.findOneAndUpdate(
    { landlordId: landlord._id, email: spec.email },
    {
      $set: {
        tenantName: spec.tenantName,
        phoneNumber: spec.phoneNumber,
        notes: spec.notes,
        ...(spec.marketplaceAccount ? { userId: marketplaceUser._id } : {}),
      },
      $setOnInsert: { landlordId: landlord._id, addedBy: landlord._id, email: spec.email },
      $unset: { archivedAt: 1 },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  if (!tenant) throw new Error(`Could not seed tenant ${spec.tenantName}`);
  return tenant;
}

function targetQuery(property: PropertyDoc, unit?: UnitDoc) {
  return unit
    ? { propertyId: property._id, unitId: unit._id, status: 'active' as const }
    : { propertyId: property._id, unitId: { $exists: false }, status: 'active' as const };
}

async function ensureLease(
  landlord: UserDoc,
  tenant: TenantDoc,
  property: PropertyDoc,
  unit: UnitDoc | undefined,
  spec: DemoLeaseSpec,
): Promise<LeaseDoc> {
  const target = targetQuery(property, unit);
  let lease = await Lease.findOne({ ...target, tenantId: tenant._id });
  if (lease) return lease;

  const occupiedByAnother = await Lease.findOne(target).lean();
  if (occupiedByAnother) {
    throw new Error(
      `Seed target ${property.propertyTitle}${unit ? `/${unit.unitNumber}` : ''} already has another active lease`,
    );
  }

  lease = await createLease(
    {
      tenantId: tenant.id,
      propertyId: property.id,
      ...(unit ? { unitId: unit.id } : {}),
      startDate: spec.startDate,
      endDate: spec.endDate,
      billingAmount: spec.billingAmount,
      schedule: spec.schedule,
    },
    { userId: landlord.id, name: landlord.fullName },
  );
  return lease;
}

async function refreshRisk(tenant: TenantDoc): Promise<void> {
  await recomputeRiskDeterministic(tenant.id);
}

async function upsertActivity(input: {
  seedKey: string;
  landlord: UserDoc;
  actor: UserDoc;
  action: string;
  category: string;
  description: string;
  property?: PropertyDoc;
  ageMinutes: number;
  flag?: string;
}): Promise<void> {
  const createdAt = new Date(Date.now() - input.ageMinutes * 60_000);
  await ActivityLog.updateOne(
    { landlordId: input.landlord._id, 'metadata.seedKey': input.seedKey },
    {
      $set: {
        actorId: input.actor._id,
        actorName: input.actor.fullName,
        landlordId: input.landlord._id,
        action: input.action,
        category: input.category,
        ...(input.property ? { propertyId: input.property._id, entityId: input.property._id } : {}),
        description: input.description,
        metadata: { seedKey: input.seedKey, screenshotFixture: true },
        ...(input.flag ? { flag: input.flag } : {}),
        createdAt,
      },
    },
    { upsert: true },
  );
}

async function seedMarketplaceInteractions(
  landlord: UserDoc,
  tenantUser: UserDoc,
  availableListings: ListingDoc[],
): Promise<void> {
  const shortlist = availableListings.slice(0, 3);
  for (const listing of shortlist) {
    await SavedListing.updateOne(
      { tenantUserId: tenantUser._id, listingId: listing._id },
      {
        $setOnInsert: {
          tenantUserId: tenantUser._id,
          listingId: listing._id,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  const enquiries = [
    {
      listing: availableListings[0],
      message: 'Hello, is this home still available for a September move-in?',
      status: 'new',
      read: false,
      replies: [],
    },
    {
      listing: availableListings[1],
      message: 'Can I arrange an inspection this Saturday morning?',
      status: 'replied',
      read: true,
      replies: [
        {
          authorId: landlord._id,
          body: 'Yes. Saturday at 10:00 am works; I will send the viewing details.',
          createdAt: new Date(Date.now() - 6 * 60 * 60_000),
        },
      ],
    },
  ] as const;

  for (const item of enquiries) {
    if (!item.listing) continue;
    await Enquiry.updateOne(
      { tenantUserId: tenantUser._id, listingId: item.listing._id, message: item.message },
      {
        $set: {
          propertyId: item.listing.propertyId,
          landlordId: landlord._id,
          status: item.status,
          read: item.read,
          replies: item.replies,
        },
        $setOnInsert: {
          tenantUserId: tenantUser._id,
          listingId: item.listing._id,
          message: item.message,
        },
      },
      { upsert: true },
    );
  }

  for (const [listingIndex, listing] of availableListings.slice(0, 8).entries()) {
    const viewCount = 3 + listingIndex * 2;
    for (let i = 0; i < viewCount; i++) {
      const viewerKey = createHash('sha256').update(`screenshot:${listing.id}:${i}`).digest('hex');
      await ListingView.updateOne(
        { listingId: listing._id, viewerKey },
        {
          $setOnInsert: {
            listingId: listing._id,
            viewerKey,
            ...(i === 0 ? { userId: tenantUser._id } : {}),
            createdAt: new Date(Date.now() - i * 3_600_000),
          },
        },
        { upsert: true },
      );
    }
    await Listing.updateOne({ _id: listing._id }, { $max: { views: viewCount } });
  }
}

async function seedConversation(landlord: UserDoc): Promise<void> {
  const summary = await summaryNumbers(landlord.id);
  const userMessage = 'How is rent collection going across my portfolio?';
  const assistantMessage = [
    `You have collected ₦${summary.collected.toLocaleString()} against an annual rent roll of ₦${summary.rollAnnual.toLocaleString()}.`,
    `₦${summary.overdueAmt.toLocaleString()} is overdue and ₦${summary.dueAmt.toLocaleString()} is due within 30 days.`,
    `${summary.occupied} of ${summary.total} rentable homes are occupied (${summary.occupancyPct}%).`,
  ].join(' ');
  const now = new Date();
  await AIConversation.updateOne(
    { userId: landlord._id, title: 'Rent collection overview' },
    {
      $set: {
        messages: [
          {
            id: 'seed-rent-question',
            role: 'user',
            content: userMessage,
            createdAt: new Date(now.getTime() - 60_000),
          },
          { id: 'seed-rent-answer', role: 'assistant', content: assistantMessage, createdAt: now },
        ],
        model: 'seeded-from-live-portfolio',
        tokenCount: 0,
      },
      $setOnInsert: { userId: landlord._id, title: 'Rent collection overview' },
    },
    { upsert: true },
  );
}

/**
 * Additive, idempotent screenshot seed. Existing demo account passwords and
 * unrelated records are preserved; reruns converge the named fixture records.
 */
export async function seed(): Promise<void> {
  assertSeedAllowed(env.NODE_ENV, env.SEED_ALLOW);

  const demoPassword = process.env.SEED_PASSWORD || 'Password123?';
  const landlord = await ensureUser(
    DEMO_EMAILS.landlord,
    { fullName: 'Demo Landlord', role: 'landlord' },
    demoPassword,
  );
  const tenantUser = await ensureUser(
    DEMO_EMAILS.tenant,
    { fullName: 'Demo Tenant', role: 'tenant' },
    demoPassword,
  );
  const caretaker = await ensureUser(
    DEMO_EMAILS.caretaker,
    { fullName: 'Femi Adewale', role: 'caretaker' },
    demoPassword,
  );

  tenantUser.preferences = {
    budgetMin: 800_000,
    budgetMax: 2_500_000,
    areas: ['Yaba', 'Lekki', 'Ikeja'],
    sizeLabel: '2-bedroom',
    bedrooms: 2,
  };
  await tenantUser.save();

  const properties = new Map<string, PropertyDoc>();
  for (const [index, spec] of DEMO_PROPERTIES.entries()) {
    properties.set(spec.key, await ensureProperty(landlord, index));
  }

  const units = new Map<string, UnitDoc>();
  for (const [index, spec] of DEMO_UNITS.entries()) {
    const property = properties.get(spec.propertyKey);
    if (!property) throw new Error(`Missing property fixture ${spec.propertyKey}`);
    units.set(`${spec.propertyKey}:${spec.label}`, await ensureUnit(property, index));
  }

  const tenants = new Map<string, TenantDoc>();
  for (const [index, spec] of DEMO_TENANTS.entries()) {
    tenants.set(spec.key, await ensureTenant(landlord, tenantUser, index));
  }

  const leases: LeaseDoc[] = [];
  for (const spec of DEMO_LEASES) {
    const property = properties.get(spec.propertyKey);
    const tenant = tenants.get(spec.tenantKey);
    const unit = spec.unitLabel ? units.get(`${spec.propertyKey}:${spec.unitLabel}`) : undefined;
    if (!property || !tenant) throw new Error(`Incomplete lease fixture for ${spec.tenantKey}`);
    const lease = await ensureLease(landlord, tenant, property, unit, spec);
    leases.push(lease);
    if (spec.paymentAmount) {
      await logPayment(
        {
          leaseId: lease.id,
          amount: spec.paymentAmount,
          paidAt: spec.paymentDate,
          method: 'transfer',
          methodDetail: 'Demo bank transfer',
          notes: 'Screenshot fixture payment',
        },
        { userId: landlord.id, name: landlord.fullName },
        `screenshot-seed:payment:${lease.id}:${spec.paymentAmount}`,
      );
    }
  }

  for (const tenant of tenants.values()) await refreshRisk(tenant);

  // Recompute every cache from leases/units, then rebuild the listing projections.
  for (const property of properties.values()) {
    await withTxn(async (session) => {
      await recomputePropertyStatus(session, property.id);
      const refreshed = await Property.findById(property._id).session(session);
      if (refreshed) await ensureListingsForProperty(session, refreshed);
    });
  }

  // Only vacant targets enter the public feed. Multi-unit fixture exposes its vacant units.
  for (const [index, spec] of DEMO_PROPERTIES.entries()) {
    const property = properties.get(spec.key)!;
    const docs = await Listing.find({ propertyId: property._id });
    for (const listing of docs) {
      const shouldList = Boolean(spec.listed || spec.hasUnits) && Boolean(listing.available);
      listing.listed = shouldList;
      listing.listedAt = shouldList ? new Date(Date.now() - index * 3_600_000) : listing.listedAt;
      await listing.save();
    }
  }

  const teamProperties = ['yaba-studio', 'herbert-macaulay-court', 'surulere-family-flat'];
  for (const key of teamProperties) {
    const property = properties.get(key)!;
    await TeamMembership.updateOne(
      { caretakerId: caretaker._id, propertyId: property._id },
      {
        $set: {
          landlordId: landlord._id,
          role: 'caretaker',
          canLogPayments: true,
          canEditTenants: true,
          canUploadImages: true,
          canManageUnits: key === 'herbert-macaulay-court',
          canEditProperty: false,
          status: 'active',
        },
      },
      { upsert: true },
    );
  }

  await Promise.all([
    upsertActivity({
      seedKey: 'caretaker-payment',
      landlord,
      actor: caretaker,
      action: 'payment.logged',
      category: 'payment',
      description: 'Recorded ₦900,000 part payment from Tunde Balogun',
      property: properties.get('ikeja-garden-apartment'),
      ageMinutes: 18,
    }),
    upsertActivity({
      seedKey: 'landlord-listing',
      landlord,
      actor: landlord,
      action: 'listing.updated',
      category: 'status',
      description: 'Published Yaba Budget Two-Bed to the marketplace',
      property: properties.get('yaba-budget-two-bed'),
      ageMinutes: 74,
    }),
    upsertActivity({
      seedKey: 'caretaker-images',
      landlord,
      actor: caretaker,
      action: 'property.updated',
      category: 'image',
      description: 'Added new property photographs for Herbert Macaulay Court',
      property: properties.get('herbert-macaulay-court'),
      ageMinutes: 165,
    }),
    upsertActivity({
      seedKey: 'landlord-tenant',
      landlord,
      actor: landlord,
      action: 'tenant.updated',
      category: 'tenant',
      description: 'Updated Amina Yusuf’s contact details',
      property: properties.get('surulere-family-flat'),
      ageMinutes: 1_520,
      flag: 'Payment follow-up recommended',
    }),
    upsertActivity({
      seedKey: 'caretaker-unit',
      landlord,
      actor: caretaker,
      action: 'unit.updated',
      category: 'unit',
      description: 'Updated rent and amenities for Unit A2',
      property: properties.get('herbert-macaulay-court'),
      ageMinutes: 1_610,
    }),
  ]);

  const availableListings = await Listing.find({
    landlordId: landlord._id,
    listed: true,
    available: true,
  }).sort({ listedAt: -1 });
  await seedMarketplaceInteractions(landlord, tenantUser, availableListings);

  await Notification.updateOne(
    { dedupeKey: 'screenshot:landlord:overdue' },
    {
      $setOnInsert: {
        userId: landlord._id,
        type: 'overdue',
        title: 'Rent follow-up required',
        body: 'Amina Yusuf has three overdue quarterly obligations.',
        deepLink: 'ileeko://payments',
        propertyId: properties.get('surulere-family-flat')!._id,
        read: false,
        dedupeKey: 'screenshot:landlord:overdue',
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );

  await seedConversation(landlord);

  const output = {
    accounts: DEMO_EMAILS,
    preservedExistingPasswords: true,
    properties: properties.size,
    units: units.size,
    tenants: tenants.size,
    leases: leases.length,
    publicListings: availableListings.length,
    payments: await Payment.countDocuments({ landlordId: landlord._id }),
    obligations: await RentObligation.countDocuments({ landlordId: landlord._id }),
  };
  // eslint-disable-next-line no-console
  console.log(`Screenshot seed complete:\n${JSON.stringify(output, null, 2)}`);
}

// Run when invoked directly (tsx src/seed/seed.ts).
const invokedDirectly = process.argv[1]?.includes('seed');
if (invokedDirectly) {
  connectDb()
    .then(seed)
    .then(disconnectDb)
    .then(() => process.exit(0))
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error(err.message);
      process.exit(1);
    });
}
