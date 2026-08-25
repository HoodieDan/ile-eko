import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import {
  Enquiry,
  Lease,
  Listing,
  Payment,
  Property,
  RentObligation,
  SavedListing,
  TeamMembership,
  Tenant,
  Unit,
  User,
} from '../src/models';
import { DEMO_EMAILS, seed } from '../src/seed/seed';
import { hashPassword } from '../src/utils/password';

const app = createApp();

async function screenshotFixtureCounts(landlordId: string, tenantUserId: string) {
  const propertyIds = await Property.find({ landlordId }).distinct('_id');
  return {
    properties: await Property.countDocuments({ landlordId }),
    units: await Unit.countDocuments({ propertyId: { $in: propertyIds } }),
    tenants: await Tenant.countDocuments({ landlordId }),
    leases: await Lease.countDocuments({ landlordId }),
    obligations: await RentObligation.countDocuments({ landlordId }),
    payments: await Payment.countDocuments({ landlordId }),
    listings: await Listing.countDocuments({ landlordId }),
    publicListings: await Listing.countDocuments({ landlordId, listed: true, available: true }),
    savedListings: await SavedListing.countDocuments({ tenantUserId }),
    enquiries: await Enquiry.countDocuments({ tenantUserId }),
    memberships: await TeamMembership.countDocuments({ landlordId, status: 'active' }),
  };
}

describe('screenshot seed', () => {
  it('is additive and idempotent, preserves demo passwords, and exposes database images', async () => {
    const landlordPassword = await hashPassword('landlord-password-that-must-survive');
    const tenantPassword = await hashPassword('tenant-password-that-must-survive');
    await User.create([
      {
        fullName: 'Existing Landlord',
        email: DEMO_EMAILS.landlord,
        password: landlordPassword,
        role: 'landlord',
      },
      {
        fullName: 'Existing Tenant',
        email: DEMO_EMAILS.tenant,
        password: tenantPassword,
        role: 'tenant',
      },
    ]);

    await seed();

    const landlord = await User.findOne({ email: DEMO_EMAILS.landlord }).select('+password');
    const tenant = await User.findOne({ email: DEMO_EMAILS.tenant }).select('+password');
    expect(landlord?.password).toBe(landlordPassword);
    expect(tenant?.password).toBe(tenantPassword);

    const firstCounts = await screenshotFixtureCounts(landlord!.id, tenant!.id);
    expect(firstCounts).toMatchObject({
      properties: 16,
      units: 4,
      tenants: 7,
      leases: 6,
      publicListings: 13,
      savedListings: 3,
      enquiries: 2,
      memberships: 3,
    });

    const feed = await request(app)
      .get('/v1/listings')
      .query({ area: 'Yaba', maxPrice: 1_000_000, minBeds: 2 });
    expect(feed.status).toBe(200);
    const yabaResult = feed.body.items.find(
      (item: { title: string }) => item.title === 'Yaba Budget Two-Bed',
    );
    expect(yabaResult).toMatchObject({ area: 'Yaba', beds: 2, rent: 950_000 });
    expect(yabaResult.imageUrl).toMatch(/^https:\/\/images\.unsplash\.com\//);

    await seed();

    const secondCounts = await screenshotFixtureCounts(landlord!.id, tenant!.id);
    expect(secondCounts).toEqual(firstCounts);
    const landlordAfterRerun = await User.findOne({ email: DEMO_EMAILS.landlord }).select(
      '+password',
    );
    const tenantAfterRerun = await User.findOne({ email: DEMO_EMAILS.tenant }).select('+password');
    expect(landlordAfterRerun?.password).toBe(landlordPassword);
    expect(tenantAfterRerun?.password).toBe(tenantPassword);
  });
});
