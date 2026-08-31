import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/app';

const app = createApp();
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

async function landlordToken(): Promise<string> {
  const res = await request(app)
    .post('/v1/auth/register')
    .send({
      name: 'Owner',
      email: `own-${randomUUID()}@example.com`,
      password: 'password123',
      role: 'landlord',
    });
  return res.body.token;
}

async function setup() {
  const token = await landlordToken();
  const prop = await request(app).post('/v1/properties').set(auth(token)).send({
    propertyTitle: 'P',
    address: 'A',
    area: 'Yaba',
    lga: 'Lagos Mainland',
    propertyType: 'mini-flat',
    rentAmount: 900000,
  });
  const tenant = await request(app)
    .post('/v1/tenants')
    .set(auth(token))
    .send({ fullName: 'T', phone: '+2348010000000' });
  const lease = await request(app).post('/v1/leases').set(auth(token)).send({
    tenantId: tenant.body.id,
    propertyId: prop.body.id,
    startDate: '2027-01-01',
    endDate: '2028-01-01',
    billingAmount: 900000,
    schedule: 'annual',
  });
  return { token, propertyId: prop.body.id, tenantId: tenant.body.id, leaseId: lease.body.id };
}

describe('M3 team: invitation → accept → caretaker access', () => {
  it('invites, accepts, and enforces per-property permissions', async () => {
    const { token, propertyId, leaseId } = await setup();

    // Invite a caretaker who can log payments (but not edit tenants)
    const invite = await request(app)
      .post('/v1/team/invite')
      .set(auth(token))
      .set('Idempotency-Key', randomUUID())
      .send({
        name: 'Care Taker',
        email: `care-${randomUUID()}@example.com`,
        grants: [{ propertyId, permissions: { canLogPayments: true } }],
      });
    expect(invite.status).toBe(201);
    const inviteToken = invite.body.token as string;

    // Accept as a new user
    const accept = await request(app)
      .post('/v1/team/accept')
      .send({ inviteToken, name: 'Care Taker', password: 'caretaker-pass' });
    expect(accept.status).toBe(201);
    const careToken = accept.body.token as string;

    // Caretaker sees the assigned property
    const props = await request(app).get('/v1/properties').set(auth(careToken));
    expect(props.status).toBe(200);
    expect(props.body.items.length).toBe(1);
    expect(props.body.items[0].id).toBe(propertyId);

    // Caretaker CAN log a payment (granted)
    const pay = await request(app)
      .post('/v1/payments')
      .set(auth(careToken))
      .set('Idempotency-Key', randomUUID())
      .send({ leaseId, amount: 900000 });
    expect(pay.status).toBe(201);

    // Caretaker CANNOT create a tenant (no canEditTenants) → 403
    const t = await request(app)
      .post('/v1/tenants')
      .set(auth(careToken))
      .send({ fullName: 'X', phone: '+2348019999999' });
    expect(t.status).toBe(403);

    // Caretaker CANNOT end the lease (landlord-only) → 403
    const end = await request(app).post(`/v1/leases/${leaseId}/end`).set(auth(careToken));
    expect(end.status).toBe(403);

    // Caretaker CANNOT create a property (landlord-only) → 403
    const create = await request(app).post('/v1/properties').set(auth(careToken)).send({
      propertyTitle: 'Z',
      address: 'A',
      area: 'B',
      lga: 'C',
      propertyType: 'other',
    });
    expect(create.status).toBe(403);

    // Caretaker CANNOT manage the team → 403
    const team = await request(app).get('/v1/team/caretakers').set(auth(careToken));
    expect(team.status).toBe(403);
  });

  it('updates one property grant and revokes all access atomically', async () => {
    const { token, propertyId } = await setup();
    const secondProperty = await request(app).post('/v1/properties').set(auth(token)).send({
      propertyTitle: 'P2',
      address: 'B',
      area: 'Ikeja',
      lga: 'Ikeja',
      propertyType: 'mini-flat',
      rentAmount: 800000,
    });
    const invite = await request(app)
      .post('/v1/team/invite')
      .set(auth(token))
      .set('Idempotency-Key', randomUUID())
      .send({
        name: 'C',
        email: `c-${randomUUID()}@example.com`,
        grants: [
          { propertyId, permissions: { canLogPayments: true } },
          { propertyId: secondProperty.body.id, permissions: { canEditTenants: true } },
        ],
      });
    const accept = await request(app)
      .post('/v1/team/accept')
      .send({ inviteToken: invite.body.token, name: 'C', password: 'password123' });
    const careToken = accept.body.token as string;

    // Find the caretaker id
    const list = await request(app).get('/v1/team/caretakers').set(auth(token));
    const caretakerId = list.body.items[0].id;

    const detail = await request(app).get(`/v1/team/caretakers/${caretakerId}`).set(auth(token));
    expect(detail.body.items).toHaveLength(2);

    const updated = await request(app)
      .patch(`/v1/team/caretakers/${caretakerId}`)
      .set(auth(token))
      .send({ propertyId, permissions: { canLogPayments: false, canUploadImages: true } });
    expect(updated.status).toBe(200);
    expect(updated.body.canLogPayments).toBe(false);
    expect(updated.body.canUploadImages).toBe(true);

    expect((await request(app).get('/v1/properties').set(auth(careToken))).status).toBe(200);

    // One backend action revokes every property membership and the live session.
    const revoke = await request(app)
      .post(`/v1/team/caretakers/${caretakerId}/revoke`)
      .set(auth(token));
    expect(revoke.status).toBe(200);
    expect(revoke.body.items).toHaveLength(2);
    expect(
      revoke.body.items.every((membership: { status: string }) => membership.status === 'revoked'),
    ).toBe(true);

    // session invalidated
    const after = await request(app).get('/v1/properties').set(auth(careToken));
    expect(after.status).toBe(401);
  });

  it('rejects an invite for a property the landlord does not own', async () => {
    const a = await setup();
    const b = await landlordToken(); // different landlord
    const invite = await request(app)
      .post('/v1/team/invite')
      .set(auth(b))
      .set('Idempotency-Key', randomUUID())
      .send({
        name: 'C',
        email: `c-${randomUUID()}@example.com`,
        grants: [{ propertyId: a.propertyId, permissions: {} }],
      });
    expect(invite.status).toBe(403);
  });
});
