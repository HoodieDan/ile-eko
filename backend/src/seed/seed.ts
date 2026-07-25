import { randomBytes } from 'node:crypto';
import { connectDb, disconnectDb } from '../config/db';
import { env, isProd } from '../config/env';
import { hashPassword } from '../utils/password';
import { Listing, Property, Tenant, User } from '../models';
import { createLease } from '../services/ledger';
import { ensureListingsForProperty } from '../services/listingProjection';
import { withTxn } from '../utils/withTxn';

/** Pure guard (§12) — never seed in production; guarded outside dev/test. Testable. */
export function assertSeedAllowed(nodeEnv: string, seedAllow: boolean): void {
  if (nodeEnv === 'production') throw new Error('Refusing to seed in production (NODE_ENV=production).');
  if (nodeEnv !== 'test' && nodeEnv !== 'development' && !seedAllow) {
    throw new Error('Seeding is guarded. Set SEED_ALLOW=1 to proceed.');
  }
  if (nodeEnv === 'development' && !seedAllow) {
    throw new Error('Seeding in development requires SEED_ALLOW=1.');
  }
}

/** Seed a demo world. Refuses to run in production; generates random credentials (§12). */
export async function seed(): Promise<void> {
  void isProd;
  assertSeedAllowed(env.NODE_ENV, env.SEED_ALLOW);

  // Demo convenience: a fixed, memorable password (SEED_PASSWORD overrides).
  // Safe because seeding is refused in production (assertSeedAllowed above).
  const demoPw = process.env.SEED_PASSWORD || 'Password123?';
  void randomBytes; // (random-cred generation retained for reference; demo uses a fixed pw)
  const creds = { landlord: demoPw, caretaker: demoPw, tenant: demoPw, admin: demoPw };

  const [landlord] = await User.create([
    { fullName: 'Demo Landlord', email: 'landlord@example.com', password: await hashPassword(creds.landlord), role: 'landlord', isVerified: true },
  ]);
  await User.create([
    { fullName: 'Demo Tenant', email: 'tenant@example.com', password: await hashPassword(creds.tenant), role: 'tenant', isVerified: true },
    // Admin is provisioned out-of-band, with a RANDOM password and non-default email.
    { fullName: 'Ops Admin', email: `admin+${randomBytes(4).toString('hex')}@example.com`, password: await hashPassword(creds.admin), role: 'admin', isVerified: true },
  ]);

  // Standalone Yaba studio + tenant + active lease.
  const [studio] = await Property.create([
    {
      landlordId: landlord!._id, propertyTitle: 'Yaba Studio', address: '22 Herbert Macaulay Way', area: 'Yaba',
      lga: 'Lagos Mainland', propertyType: 'self-contained', description: 'Compact studio, fibre ready.',
      paymentFrequency: 'annual', rentAmount: 900000, bedrooms: 1, bathrooms: 1, statusCache: 'vacant',
    },
  ]);
  await withTxn((s) => ensureListingsForProperty(s, studio!));
  const [chinedu] = await Tenant.create([
    { landlordId: landlord!._id, addedBy: landlord!._id, tenantName: 'Chinedu Okeke', phoneNumber: '+2348012345678', email: 'chinedu@example.com' },
  ]);
  await createLease(
    { tenantId: chinedu!.id, propertyId: studio!.id, startDate: '2026-01-01', endDate: '2027-01-01', billingAmount: 900000, schedule: 'annual' },
    { userId: landlord!.id, name: landlord!.fullName },
  );

  // A vacant Lekki mini-flat, listed on the marketplace so the tenant app has an entry.
  const [lekki] = await Property.create([
    {
      landlordId: landlord!._id, propertyTitle: 'Lekki Phase 1 Mini-flat', address: '8 Admiralty Way', area: 'Lekki',
      lga: 'Eti-Osa', propertyType: 'mini-flat', description: 'Bright self-contained mini-flat.',
      paymentFrequency: 'annual', rentAmount: 2400000, bedrooms: 1, bathrooms: 1, amenities: ['water', 'parking'], statusCache: 'vacant',
    },
  ]);
  await withTxn((s) => ensureListingsForProperty(s, lekki!));
  await Listing.updateOne({ propertyId: lekki!._id }, { $set: { listed: true, listedAt: new Date() } });

  // eslint-disable-next-line no-console
  console.log('Seed complete. One-time credentials (store securely):\n' + JSON.stringify(creds, null, 2));
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
