import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/app';

const app = createApp();

async function landlordToken(): Promise<string> {
  const res = await request(app)
    .post('/v1/auth/register')
    .send({
      name: 'Land Lord',
      email: `ll-${randomUUID()}@example.com`,
      password: 'password123',
      role: 'landlord',
    });
  return res.body.token;
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

describe('M2 ledger: standalone property lifecycle', () => {
  let token: string;
  beforeEach(async () => {
    token = await landlordToken();
  });

  it('create property → tenant → lease generates obligations, occupies, unlists', async () => {
    const prop = await request(app).post('/v1/properties').set(auth(token)).send({
      propertyTitle: 'Yaba Studio',
      address: '22 Herbert Macaulay',
      area: 'Yaba',
      lga: 'Lagos Mainland',
      propertyType: 'self-contained',
      paymentFrequency: 'annual',
      rentAmount: 900000,
    });
    expect(prop.status).toBe(201);
    expect(prop.body.status).toBe('vacant');
    const propertyId = prop.body.id;

    const tenant = await request(app)
      .post('/v1/tenants')
      .set(auth(token))
      .send({ fullName: 'Chinedu Okeke', phone: '+2348012345678' });
    expect(tenant.status).toBe(201);
    expect(tenant.body.status).toBe('no-lease');
    const tenantId = tenant.body.id;

    const lease = await request(app).post('/v1/leases').set(auth(token)).send({
      tenantId,
      propertyId,
      startDate: '2026-01-01',
      endDate: '2028-01-01', // 2 annual periods
      billingAmount: 900000,
      schedule: 'annual',
    });
    expect(lease.status).toBe(201);
    expect(lease.body.annualizedRent).toBe(900000);

    // Property now occupied
    const detail = await request(app).get(`/v1/properties/${propertyId}`).set(auth(token));
    expect(detail.body.status).toBe('occupied');

    // Tenant now has lease facts
    const t2 = await request(app).get(`/v1/tenants/${tenantId}`).set(auth(token));
    expect(t2.body.status).toBe('overdue'); // 2026 obligation is past due relative to now (2026-07)
    expect(t2.body.rentAmount).toBe(900000);
  });

  it('cannot create a second active lease on the same target', async () => {
    const prop = await request(app).post('/v1/properties').set(auth(token)).send({
      propertyTitle: 'P',
      address: 'A',
      area: 'Lekki',
      lga: 'Eti-Osa',
      propertyType: 'mini-flat',
      rentAmount: 1000000,
    });
    const t1 = await request(app)
      .post('/v1/tenants')
      .set(auth(token))
      .send({ fullName: 'T1', phone: '+2348000000001' });
    const t2 = await request(app)
      .post('/v1/tenants')
      .set(auth(token))
      .send({ fullName: 'T2', phone: '+2348000000002' });
    const base = {
      propertyId: prop.body.id,
      startDate: '2026-01-01',
      endDate: '2027-01-01',
      billingAmount: 1000000,
      schedule: 'annual',
    };
    const l1 = await request(app)
      .post('/v1/leases')
      .set(auth(token))
      .send({ ...base, tenantId: t1.body.id });
    expect(l1.status).toBe(201);
    const l2 = await request(app)
      .post('/v1/leases')
      .set(auth(token))
      .send({ ...base, tenantId: t2.body.id });
    expect(l2.status).toBe(409);

    const secondProp = await request(app).post('/v1/properties').set(auth(token)).send({
      propertyTitle: 'P2',
      address: 'B',
      area: 'Lekki',
      lga: 'Eti-Osa',
      propertyType: 'mini-flat',
      rentAmount: 1100000,
    });
    const secondLeaseForTenant = await request(app)
      .post('/v1/leases')
      .set(auth(token))
      .send({ ...base, propertyId: secondProp.body.id, tenantId: t1.body.id });
    expect(secondLeaseForTenant.status).toBe(409);
  });
});

describe('M2 ledger: payments, allocation, idempotency, reversal', () => {
  let token: string;
  let leaseId: string;
  let tenantId: string;

  beforeEach(async () => {
    token = await landlordToken();
    const prop = await request(app).post('/v1/properties').set(auth(token)).send({
      propertyTitle: 'P',
      address: 'A',
      area: 'Ikeja',
      lga: 'Ikeja',
      propertyType: 'two-bedroom',
      rentAmount: 1200000,
    });
    const tenant = await request(app)
      .post('/v1/tenants')
      .set(auth(token))
      .send({ fullName: 'Tayo', phone: '+2348011111111' });
    tenantId = tenant.body.id;
    // Future-dated so a partial payment reads as 'partial' (not yet overdue).
    const lease = await request(app).post('/v1/leases').set(auth(token)).send({
      tenantId,
      propertyId: prop.body.id,
      startDate: '2027-01-01',
      endDate: '2028-01-01',
      billingAmount: 1200000,
      schedule: 'annual',
    });
    leaseId = lease.body.id;
  });

  it('requires an Idempotency-Key and records payment once on retry', async () => {
    const noKey = await request(app)
      .post('/v1/payments')
      .set(auth(token))
      .send({ leaseId, amount: 600000 });
    expect(noKey.status).toBe(400);

    const key = randomUUID();
    const first = await request(app)
      .post('/v1/payments')
      .set(auth(token))
      .set('Idempotency-Key', key)
      .send({ leaseId, amount: 600000 });
    expect(first.status).toBe(201);
    const retry = await request(app)
      .post('/v1/payments')
      .set(auth(token))
      .set('Idempotency-Key', key)
      .send({ leaseId, amount: 600000 });
    expect(retry.status).toBe(201);
    expect(retry.body.id).toBe(first.body.id); // same payment, not duplicated

    // A different body with the same key → 409
    const conflict = await request(app)
      .post('/v1/payments')
      .set(auth(token))
      .set('Idempotency-Key', key)
      .send({ leaseId, amount: 999999 });
    expect(conflict.status).toBe(409);
  });

  it('partial then full payment moves obligation settlement partial → paid; tenant status updates', async () => {
    await request(app)
      .post('/v1/payments')
      .set(auth(token))
      .set('Idempotency-Key', randomUUID())
      .send({ leaseId, amount: 600000 });
    let t = await request(app).get(`/v1/tenants/${tenantId}`).set(auth(token));
    expect(t.body.status).toBe('partial');

    await request(app)
      .post('/v1/payments')
      .set(auth(token))
      .set('Idempotency-Key', randomUUID())
      .send({ leaseId, amount: 600000 });
    t = await request(app).get(`/v1/tenants/${tenantId}`).set(auth(token));
    expect(t.body.status).toBe('up-to-date');

    // history reflects two receipts
    expect(t.body.history.length).toBe(2);
  });

  it('reversal offsets the payment (immutable ledger) and cannot double-reverse', async () => {
    const pay = await request(app)
      .post('/v1/payments')
      .set(auth(token))
      .set('Idempotency-Key', randomUUID())
      .send({ leaseId, amount: 1200000 });
    let t = await request(app).get(`/v1/tenants/${tenantId}`).set(auth(token));
    expect(t.body.status).toBe('up-to-date');

    const rev = await request(app)
      .post(`/v1/payments/${pay.body.id}/reverse`)
      .set(auth(token))
      .set('Idempotency-Key', randomUUID());
    expect(rev.status).toBe(201);
    expect(rev.body.amount).toBe(-1200000);

    t = await request(app).get(`/v1/tenants/${tenantId}`).set(auth(token));
    expect(t.body.status).toBe('due'); // obligation re-opened (future-dated → due, not overdue)

    // second reverse of the SAME payment returns the existing reversal (idempotent), not a new one
    const rev2 = await request(app)
      .post(`/v1/payments/${pay.body.id}/reverse`)
      .set(auth(token))
      .set('Idempotency-Key', randomUUID());
    expect(rev2.body.id).toBe(rev.body.id);
  });
});

describe('M2: lease end, dashboard, archive guard', () => {
  it('ending a lease vacates the target and dashboard reflects occupancy', async () => {
    const token = await landlordToken();
    const prop = await request(app).post('/v1/properties').set(auth(token)).send({
      propertyTitle: 'P',
      address: 'A',
      area: 'Surulere',
      lga: 'Surulere',
      propertyType: 'mini-flat',
      rentAmount: 800000,
    });
    const tenant = await request(app)
      .post('/v1/tenants')
      .set(auth(token))
      .send({ fullName: 'Zed', phone: '+2348022222222' });
    const lease = await request(app).post('/v1/leases').set(auth(token)).send({
      tenantId: tenant.body.id,
      propertyId: prop.body.id,
      startDate: '2026-01-01',
      endDate: '2027-01-01',
      billingAmount: 800000,
      schedule: 'annual',
    });

    let dash = await request(app).get('/v1/dashboard/summary').set(auth(token));
    expect(dash.body.summary.occupied).toBe(1);
    expect(dash.body.summary.total).toBe(1);

    // cannot archive with an active lease
    const archived = await request(app).delete(`/v1/properties/${prop.body.id}`).set(auth(token));
    expect(archived.status).toBe(409);

    const end = await request(app).post(`/v1/leases/${lease.body.id}/end`).set(auth(token));
    expect(end.status).toBe(200);

    const detail = await request(app).get(`/v1/properties/${prop.body.id}`).set(auth(token));
    expect(detail.body.status).toBe('vacant');

    dash = await request(app).get('/v1/dashboard/summary').set(auth(token));
    expect(dash.body.summary.occupied).toBe(0);
  });

  it('evicts a current tenant, vacates the target, and keeps them in eviction history', async () => {
    const token = await landlordToken();
    const prop = await request(app).post('/v1/properties').set(auth(token)).send({
      propertyTitle: 'Eviction test',
      address: '1 Test Road',
      area: 'Yaba',
      lga: 'Lagos Mainland',
      propertyType: 'mini-flat',
      rentAmount: 800000,
    });
    const tenant = await request(app).post('/v1/tenants').set(auth(token)).send({
      fullName: 'Former Tenant',
      phone: '+2348022222299',
    });
    await request(app).post('/v1/leases').set(auth(token)).send({
      tenantId: tenant.body.id,
      propertyId: prop.body.id,
      startDate: '2026-01-01',
      endDate: '2027-01-01',
      billingAmount: 800000,
      schedule: 'annual',
    });

    const evicted = await request(app).post(`/v1/tenants/${tenant.body.id}/evict`).set(auth(token));
    expect(evicted.status).toBe(200);
    expect(evicted.body.lifecycle).toBe('evicted');
    expect(evicted.body.status).toBe('no-lease');
    expect(evicted.body.previousPropertyId).toBe(prop.body.id);

    const current = await request(app).get('/v1/tenants').set(auth(token));
    expect(current.body.items.some((item: { id: string }) => item.id === tenant.body.id)).toBe(
      false,
    );

    const history = await request(app).get('/v1/tenants?view=evicted').set(auth(token));
    expect(history.body.items.some((item: { id: string }) => item.id === tenant.body.id)).toBe(
      true,
    );

    const propertyHistory = await request(app)
      .get(`/v1/tenants?view=evicted&propertyId=${prop.body.id}`)
      .set(auth(token));
    expect(
      propertyHistory.body.items.some((item: { id: string }) => item.id === tenant.body.id),
    ).toBe(true);

    const property = await request(app).get(`/v1/properties/${prop.body.id}`).set(auth(token));
    expect(property.body.status).toBe('vacant');
  });
});
