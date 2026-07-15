import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/app';
import { scoreRisk } from '../src/ai/risk';
import { setEngine, resetEngine, type AIEngine } from '../src/ai/engine';

const app = createApp();
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

async function landlordToken(): Promise<string> {
  const res = await request(app).post('/v1/auth/register').send({
    name: 'LL', email: `ll-${randomUUID()}@example.com`, password: 'password123', role: 'landlord',
  });
  return res.body.token;
}

/** Property + tenant + lease; returns ids. */
async function withLease(token: string, startDate = '2026-01-01', endDate = '2027-01-01') {
  const prop = await request(app).post('/v1/properties').set(auth(token)).send({
    propertyTitle: 'P', address: 'A', area: 'Yaba', lga: 'Lagos Mainland', propertyType: 'two-bedroom', rentAmount: 1200000, bedrooms: 2,
  });
  const tenant = await request(app).post('/v1/tenants').set(auth(token)).send({ fullName: 'T', phone: '+2348010000000' });
  const lease = await request(app).post('/v1/leases').set(auth(token)).send({
    tenantId: tenant.body.id, propertyId: prop.body.id, startDate, endDate, billingAmount: 1200000, schedule: 'annual',
  });
  return { propertyId: prop.body.id, tenantId: tenant.body.id, leaseId: lease.body.id };
}

describe('M5 risk: deterministic scoring', () => {
  it('scoreRisk is a pure deterministic function of features', () => {
    expect(scoreRisk({ totalObligations: 1, paidObligations: 1, overdueCount: 0, maxDaysOverdue: 0, partialRatio: 0, paidRatio: 1 }).band).toBe('low');
    const high = scoreRisk({ totalObligations: 3, paidObligations: 0, overdueCount: 3, maxDaysOverdue: 120, partialRatio: 0.3, paidRatio: 0 });
    expect(high.band).toBe('high');
    expect(high.score).toBeGreaterThan(0.66);
  });

  it('recompute reflects an overdue obligation, then clears after payment', async () => {
    const token = await landlordToken();
    const { tenantId, leaseId } = await withLease(token); // 2026 lease → overdue as of test date

    const risk = await request(app).post(`/v1/tenants/${tenantId}/risk/recompute`).set(auth(token));
    expect(risk.status).toBe(200);
    expect(['medium', 'high']).toContain(risk.body.band);
    expect(risk.body.scoringVersion).toBe('risk-v1');

    // tenant list now shows cached risk
    const list = await request(app).get('/v1/tenants').set(auth(token));
    expect(list.body.items[0].risk.band).toBe(risk.body.band);

    // pay in full → recompute → low
    await request(app).post('/v1/payments').set(auth(token)).set('Idempotency-Key', randomUUID()).send({ leaseId, amount: 1200000 });
    const cleared = await request(app).post(`/v1/tenants/${tenantId}/risk/recompute`).set(auth(token));
    expect(cleared.body.band).toBe('low');
  });
});

describe('M5 AI: degraded fallback with no key', () => {
  it('briefing returns a deterministic degraded briefing', async () => {
    const token = await landlordToken();
    await withLease(token);
    const res = await request(app).get('/v1/ai/briefing').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.degraded).toBe(true);
    expect(res.body.headline).toBeTypeOf('string');
    expect(Array.isArray(res.body.points)).toBe(true);
  });

  it('chat returns a degraded assistant message and persists the conversation', async () => {
    const token = await landlordToken();
    const res = await request(app).post('/v1/ai/chat').set(auth(token)).send({ message: 'How much rent is overdue?' });
    expect(res.status).toBe(200);
    expect(res.body.degraded).toBe(true);
    expect(res.body.conversationId).toBeTypeOf('string');
    const convos = await request(app).get('/v1/ai/conversations').set(auth(token));
    expect(convos.body.items.length).toBe(1);
  });

  it('search still returns results via the heuristic parse (degraded)', async () => {
    const res = await request(app).post('/v1/search').send({ query: '2 bedroom in Yaba under 1m' });
    expect(res.status).toBe(200);
    expect(res.body.degraded).toBe(true);
    expect(res.body.filters).toMatchObject({ minBeds: 2, area: 'yaba' });
  });
});

describe('M5 AI: engine paths (injected fake, no live calls)', () => {
  const fake: AIEngine = {
    // eslint-disable-next-line @typescript-eslint/require-await
    async generateObject({ schema }) {
      // Return schema-valid canned objects per feature.
      const shape = JSON.stringify(Object.keys((schema as { shape?: object }).shape ?? {}));
      if (shape.includes('headline')) return { headline: 'AI headline', points: ['a', 'b'], actionCount: 1 } as never;
      if (shape.includes('suggestedRent')) return { suggestedRent: 1500000, rationale: 'AI rationale' } as never;
      return { area: 'lekki', minBeds: 3, maxPrice: 2000000 } as never; // search filters
    },
    async generateText() {
      return 'AI assistant reply grounded in your portfolio.';
    },
  };

  afterEach(() => {
    resetEngine();
    delete process.env.AI_API_KEY;
  });

  it('briefing, chat, search, rent-suggestion use the engine when a key is set', async () => {
    process.env.AI_API_KEY = 'test-key';
    setEngine(fake);

    const token = await landlordToken();
    const { propertyId } = await withLease(token, '2027-01-01', '2028-01-01');
    // add a comparable listing in Yaba so rent-suggestion has comparables
    const prop2 = await request(app).post('/v1/properties').set(auth(token)).send({
      propertyTitle: 'C', address: 'B', area: 'Yaba', lga: 'Lagos Mainland', propertyType: 'two-bedroom', rentAmount: 1400000, bedrooms: 2,
    });
    const d2 = await request(app).get(`/v1/properties/${prop2.body.id}`).set(auth(token));
    await request(app).patch(`/v1/listings/${d2.body.listings[0].id}`).set(auth(token)).send({ listed: true });

    const briefing = await request(app).get('/v1/ai/briefing').set(auth(token));
    expect(briefing.body.headline).toBe('AI headline');
    expect(briefing.body.degraded).toBeUndefined();

    const chat = await request(app).post('/v1/ai/chat').set(auth(token)).send({ message: 'status?' });
    expect(chat.body.message).toContain('AI assistant reply');
    expect(chat.body.degraded).toBeUndefined();

    const search = await request(app).post('/v1/search').send({ query: 'anything' });
    expect(search.body.filters).toMatchObject({ area: 'lekki', minBeds: 3, maxPrice: 2000000 });
    expect(search.body.degraded).toBeUndefined();

    const rent = await request(app).get(`/v1/properties/${propertyId}/rent-suggestion`).set(auth(token));
    expect(rent.body.suggestedRent).toBe(1500000);
    expect(rent.body.rationale).toBe('AI rationale');
  });
});
