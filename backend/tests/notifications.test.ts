import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/app';
import { drainOutbox } from '../src/worker/outbox';
import { dailySweep } from '../src/services/reminders';
import { assertSeedAllowed } from '../src/seed/seed';

const app = createApp();
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

async function landlordToken(): Promise<string> {
  const res = await request(app).post('/v1/auth/register').send({ name: 'LL', email: `ll-${randomUUID()}@example.com`, password: 'password123', role: 'landlord' });
  return res.body.token;
}
async function tenantToken(): Promise<string> {
  const res = await request(app).post('/v1/auth/register').send({ name: 'TT', email: `tt-${randomUUID()}@example.com`, password: 'password123', role: 'tenant' });
  return res.body.token;
}

describe('M6 outbox worker', () => {
  it('processes enquiry.received into a landlord notification, idempotently', async () => {
    const landlord = await landlordToken();
    const prop = await request(app).post('/v1/properties').set(auth(landlord)).send({
      propertyTitle: 'P', address: 'A', area: 'Lekki', lga: 'Eti-Osa', propertyType: 'mini-flat', rentAmount: 900000, bedrooms: 1,
    });
    const detail = await request(app).get(`/v1/properties/${prop.body.id}`).set(auth(landlord));
    const listingId = detail.body.listings[0].id;
    await request(app).patch(`/v1/listings/${listingId}`).set(auth(landlord)).send({ listed: true });

    const tt = await tenantToken();
    await request(app).post('/v1/enquiries').set(auth(tt)).set('Idempotency-Key', randomUUID()).send({ listingId, message: 'Interested!' });

    // No notification until the outbox is drained.
    let notifs = await request(app).get('/v1/notifications').set(auth(landlord));
    expect(notifs.body.items.length).toBe(0);

    const processed = await drainOutbox();
    expect(processed).toBeGreaterThanOrEqual(1);

    notifs = await request(app).get('/v1/notifications').set(auth(landlord));
    expect(notifs.body.items.length).toBe(1);
    expect(notifs.body.unreadCount).toBe(1);
    expect(notifs.body.items[0].title).toBe('New enquiry');

    // Re-draining must NOT duplicate the notification (EffectDelivery idempotency).
    await drainOutbox();
    notifs = await request(app).get('/v1/notifications').set(auth(landlord));
    expect(notifs.body.items.length).toBe(1);

    // mark read
    await request(app).patch(`/v1/notifications/${notifs.body.items[0].id}/read`).set(auth(landlord));
    const after = await request(app).get('/v1/notifications').set(auth(landlord));
    expect(after.body.unreadCount).toBe(0);
  });
});

describe('M6 reminders sweep', () => {
  it('notifies overdue rent, is idempotent per day, and skips on re-run', async () => {
    const landlord = await landlordToken();
    const prop = await request(app).post('/v1/properties').set(auth(landlord)).send({
      propertyTitle: 'P', address: 'A', area: 'Yaba', lga: 'Lagos Mainland', propertyType: 'two-bedroom', rentAmount: 1200000, bedrooms: 2,
    });
    const tenant = await request(app).post('/v1/tenants').set(auth(landlord)).send({ fullName: 'T', phone: '+2348010000000' });
    await request(app).post('/v1/leases').set(auth(landlord)).send({
      tenantId: tenant.body.id, propertyId: prop.body.id, startDate: '2026-01-01', endDate: '2027-01-01', billingAmount: 1200000, schedule: 'annual',
    });

    const first = await dailySweep();
    expect(first.skipped).toBe(false);
    expect(first.notified).toBeGreaterThanOrEqual(1);

    const notifs = await request(app).get('/v1/notifications').set(auth(landlord));
    expect(notifs.body.items.some((n: { type: string }) => n.type === 'overdue')).toBe(true);

    // Same-day re-run is a no-op (TaskRun guard).
    const second = await dailySweep();
    expect(second.skipped).toBe(true);
  });
});

describe('M6 seed guard', () => {
  it('refuses production and requires opt-in outside dev/test', () => {
    expect(() => assertSeedAllowed('production', false)).toThrow(/production/i);
    expect(() => assertSeedAllowed('production', true)).toThrow(/production/i);
    expect(() => assertSeedAllowed('staging', false)).toThrow();
    expect(() => assertSeedAllowed('test', false)).not.toThrow();
    expect(() => assertSeedAllowed('development', true)).not.toThrow();
    expect(() => assertSeedAllowed('development', false)).toThrow(/SEED_ALLOW/);
  });
});
