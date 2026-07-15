import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/app';

const app = createApp();
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

async function landlordToken(): Promise<string> {
  const res = await request(app).post('/v1/auth/register').send({
    name: 'LL', email: `ll-${randomUUID()}@example.com`, password: 'password123', role: 'landlord',
  });
  return res.body.token;
}
async function tenantToken(): Promise<string> {
  const res = await request(app).post('/v1/auth/register').send({
    name: 'TT', email: `tt-${randomUUID()}@example.com`, password: 'password123', role: 'tenant',
  });
  return res.body.token;
}

/** Create a listed, vacant standalone property; return { landlordToken, listingId, propertyId }. */
async function listedProperty(overrides: Record<string, unknown> = {}) {
  const token = await landlordToken();
  const prop = await request(app).post('/v1/properties').set(auth(token)).send({
    propertyTitle: 'Lekki Mini-flat', address: '8 Admiralty', area: 'Lekki', lga: 'Eti-Osa',
    propertyType: 'mini-flat', rentAmount: 900000, bedrooms: 2, bathrooms: 1, amenities: ['water', 'parking'],
    ...overrides,
  });
  const detail = await request(app).get(`/v1/properties/${prop.body.id}`).set(auth(token));
  const listingId = detail.body.listings[0].id;
  await request(app).patch(`/v1/listings/${listingId}`).set(auth(token)).send({ listed: true });
  return { token, listingId, propertyId: prop.body.id };
}

describe('M4 marketplace: public browse + toggle', () => {
  it('lists a listed vacant property publicly (anonymous)', async () => {
    const { listingId } = await listedProperty();
    const feed = await request(app).get('/v1/listings');
    expect(feed.status).toBe(200);
    expect(feed.body.items.some((l: { id: string }) => l.id === listingId)).toBe(true);
    const one = feed.body.items.find((l: { id: string }) => l.id === listingId);
    expect(one.title).toBe('Lekki Mini-flat');
    expect(one.beds).toBe(2);
    expect(one).not.toHaveProperty('views'); // views never surfaced to tenants
  });

  it('filters the feed by area and maxPrice', async () => {
    await listedProperty({ area: 'Yaba', rentAmount: 500000 });
    await listedProperty({ area: 'Lekki', rentAmount: 2000000 });
    const cheapYaba = await request(app).get('/v1/listings?area=Yaba&maxPrice=800000');
    expect(cheapYaba.body.items.length).toBeGreaterThanOrEqual(1);
    expect(cheapYaba.body.items.every((l: { area: string }) => /yaba/i.test(l.area))).toBe(true);
  });

  it('cannot list an occupied target', async () => {
    const token = await landlordToken();
    const prop = await request(app).post('/v1/properties').set(auth(token)).send({
      propertyTitle: 'P', address: 'A', area: 'Ikeja', lga: 'Ikeja', propertyType: 'mini-flat', rentAmount: 800000, bedrooms: 1,
    });
    const tenant = await request(app).post('/v1/tenants').set(auth(token)).send({ fullName: 'T', phone: '+2348010000009' });
    await request(app).post('/v1/leases').set(auth(token)).send({
      tenantId: tenant.body.id, propertyId: prop.body.id, startDate: '2027-01-01', endDate: '2028-01-01', billingAmount: 800000, schedule: 'annual',
    });
    const detail = await request(app).get(`/v1/properties/${prop.body.id}`).set(auth(token));
    const listingId = detail.body.listings[0].id;
    const toggle = await request(app).patch(`/v1/listings/${listingId}`).set(auth(token)).send({ listed: true });
    expect(toggle.status).toBe(409);
  });
});

describe('M4 marketplace: search, save, view', () => {
  it('parses a natural-language query into structured filters', async () => {
    await listedProperty({ area: 'Yaba', rentAmount: 700000, bedrooms: 2 });
    const res = await request(app).post('/v1/search').send({ query: '2 bedroom in Yaba under 1m with water' });
    expect(res.status).toBe(200);
    expect(res.body.filters).toMatchObject({ minBeds: 2, area: 'yaba', maxPrice: 1000000 });
    expect(res.body.filters.amenities).toContain('water');
  });

  it('tenant saves and unsaves a listing', async () => {
    const { listingId } = await listedProperty();
    const tt = await tenantToken();
    const save = await request(app).post('/v1/saved-listings').set(auth(tt)).send({ listingId });
    expect(save.status).toBe(201);
    let saved = await request(app).get('/v1/saved-listings').set(auth(tt));
    expect(saved.body.items.length).toBe(1);
    expect(saved.body.items[0].saved).toBe(true);
    await request(app).delete(`/v1/saved-listings/${listingId}`).set(auth(tt));
    saved = await request(app).get('/v1/saved-listings').set(auth(tt));
    expect(saved.body.items.length).toBe(0);
  });

  it('records a view once per viewer (deduped)', async () => {
    const { listingId, token } = await listedProperty();
    await request(app).post(`/v1/listings/${listingId}/view`).set('X-Session-Id', 'sess-1');
    await request(app).post(`/v1/listings/${listingId}/view`).set('X-Session-Id', 'sess-1');
    await request(app).post(`/v1/listings/${listingId}/view`).set('X-Session-Id', 'sess-2');
    const detail = await request(app).get(`/v1/properties/${(await request(app).get('/v1/listings')).body.items[0].propertyId}`).set(auth(token));
    // 2 distinct sessions → 2 views
    const listing = detail.body.listings.find((l: { id: string }) => l.id === listingId);
    expect(listing.views).toBe(2);
  });
});

describe('M4 enquiries: two-sided', () => {
  it('tenant enquires (auth-gated), landlord sees inbox + replies, tenant sees reply', async () => {
    const { token: landlord, listingId } = await listedProperty();
    const tt = await tenantToken();

    // anonymous cannot enquire
    const anon = await request(app).post('/v1/enquiries').set('Idempotency-Key', randomUUID()).send({ listingId, message: 'hi' });
    expect(anon.status).toBe(401);

    const enquire = await request(app)
      .post('/v1/enquiries')
      .set(auth(tt))
      .set('Idempotency-Key', randomUUID())
      .send({ listingId, message: 'Is this still available for August?' });
    expect(enquire.status).toBe(201);

    // Landlord inbox shows it, unread
    const inbox = await request(app).get('/v1/enquiries').set(auth(landlord));
    expect(inbox.status).toBe(200);
    expect(inbox.body.unreadCount).toBe(1);
    expect(inbox.body.items[0].read).toBe(false);
    expect(inbox.body.items[0].snippet).toContain('August');
    const enquiryId = inbox.body.items[0].id;

    // Landlord replies
    const reply = await request(app)
      .post(`/v1/enquiries/${enquiryId}/replies`)
      .set(auth(landlord))
      .send({ body: 'Yes, still available!' });
    expect(reply.status).toBe(201);

    // Now read + replied
    const inbox2 = await request(app).get('/v1/enquiries').set(auth(landlord));
    expect(inbox2.body.unreadCount).toBe(0);
    expect(inbox2.body.items[0].status).toBe('replied');

    // Tenant sees the reply in /mine
    const mine = await request(app).get('/v1/enquiries/mine').set(auth(tt));
    expect(mine.body.items[0].reply).toBe('Yes, still available!');
    expect(mine.body.items[0].status).toBe('replied');

    // Dashboard unread reflects enquiries
    const dash = await request(app).get('/v1/dashboard/summary').set(auth(landlord));
    expect(dash.body.enquiriesUnread).toBe(0);
  });
});
