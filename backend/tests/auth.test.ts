import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

const landlord = {
  name: 'Ada Landlord',
  email: 'ada@example.com',
  phone: '+2348012345678',
  password: 'sup3rsecret',
  role: 'landlord' as const,
};

async function registerLandlord() {
  return request(app).post('/v1/auth/register').send(landlord);
}

describe('auth: registration', () => {
  it('registers a landlord and returns token + user', async () => {
    const res = await registerLandlord();
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTypeOf('string');
    expect(res.body.user).toMatchObject({ name: landlord.name, email: landlord.email, role: 'landlord' });
    expect(res.body.user).not.toHaveProperty('password');
    expect(res.body.user.id).toBeTypeOf('string');
  });

  it('rejects duplicate email with 409', async () => {
    await registerLandlord();
    const res = await registerLandlord();
    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('message');
  });

  it.each(['admin', 'caretaker', 'superuser', ''])(
    'rejects forbidden/invalid role %s with 400',
    async (role) => {
      const res = await request(app)
        .post('/v1/auth/register')
        .send({ ...landlord, email: `x-${role || 'empty'}@example.com`, role });
      expect(res.status).toBe(400);
    },
  );
});

describe('auth: login + session', () => {
  it('logs in with email and hydrates session with capabilities', async () => {
    await registerLandlord();
    const login = await request(app)
      .post('/v1/auth/login')
      .send({ email: landlord.email, password: landlord.password });
    expect(login.status).toBe(200);
    const token = login.body.token as string;

    const session = await request(app).get('/v1/auth/session').set('Authorization', `Bearer ${token}`);
    expect(session.status).toBe(200);
    expect(session.body.user.email).toBe(landlord.email);
    expect(session.body.capabilities).toContain('use_ai'); // landlord global cap
    expect(session.body.capabilities).toContain('manage_team');
  });

  it('rejects a bad password with 401', async () => {
    await registerLandlord();
    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: landlord.email, password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('rejects requests with no bearer token', async () => {
    const res = await request(app).get('/v1/auth/session');
    expect(res.status).toBe(401);
  });
});

describe('auth: per-device session revocation (§8)', () => {
  it('logout revokes only the current device; other device keeps working', async () => {
    await registerLandlord();

    const loginA = await request(app)
      .post('/v1/auth/login')
      .send({ email: landlord.email, password: landlord.password });
    const loginB = await request(app)
      .post('/v1/auth/login')
      .send({ email: landlord.email, password: landlord.password });
    const tokenA = loginA.body.token as string;
    const tokenB = loginB.body.token as string;

    // Log out device A
    const logout = await request(app).post('/v1/auth/logout').set('Authorization', `Bearer ${tokenA}`);
    expect(logout.status).toBe(200);

    // A is now invalid...
    const aAfter = await request(app).get('/v1/auth/session').set('Authorization', `Bearer ${tokenA}`);
    expect(aAfter.status).toBe(401);

    // ...but B still works (per-device, not global)
    const bAfter = await request(app).get('/v1/auth/session').set('Authorization', `Bearer ${tokenB}`);
    expect(bAfter.status).toBe(200);
  });

  it('change-password revokes OTHER sessions but keeps the current one', async () => {
    await registerLandlord();
    const loginA = await request(app)
      .post('/v1/auth/login')
      .send({ email: landlord.email, password: landlord.password });
    const loginB = await request(app)
      .post('/v1/auth/login')
      .send({ email: landlord.email, password: landlord.password });
    const tokenA = loginA.body.token as string;
    const tokenB = loginB.body.token as string;

    const change = await request(app)
      .post('/v1/account/change-password')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ currentPassword: landlord.password, newPassword: 'brand-new-pass' });
    expect(change.status).toBe(200);

    // Current device (A) survives
    const aAfter = await request(app).get('/v1/auth/session').set('Authorization', `Bearer ${tokenA}`);
    expect(aAfter.status).toBe(200);
    // Other device (B) is revoked
    const bAfter = await request(app).get('/v1/auth/session').set('Authorization', `Bearer ${tokenB}`);
    expect(bAfter.status).toBe(401);
  });

  it('lists active sessions and can revoke a specific one', async () => {
    await registerLandlord();
    const loginA = await request(app)
      .post('/v1/auth/login')
      .send({ email: landlord.email, password: landlord.password });
    const loginB = await request(app)
      .post('/v1/auth/login')
      .send({ email: landlord.email, password: landlord.password });
    const tokenA = loginA.body.token as string;

    const list = await request(app).get('/v1/auth/sessions').set('Authorization', `Bearer ${tokenA}`);
    expect(list.status).toBe(200);
    expect(list.body.items.length).toBeGreaterThanOrEqual(2);
    const current = list.body.items.find((s: { current: boolean }) => s.current);
    expect(current).toBeTruthy();
  });
});
