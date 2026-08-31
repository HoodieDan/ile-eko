import { Types } from 'mongoose';
import { AppError } from '../../utils/AppError';
import { withTxn } from '../../utils/withTxn';
import { Lease, Payment, Tenant, type TenantDoc } from '../../models';
import { emitActivity } from '../../services/activityLog';
import { tenantLeaseFacts } from '../../services/stats';
import { endLease } from '../../services/ledger';
import { presentTenant, presentPayment } from '../../presenters/entities';
import type { CreateTenantInput, PaymentDTO, TenantDTO, UpdateTenantInput } from '../../contracts';

interface Actor {
  userId: string;
  name: string;
}

async function ownedTenant(landlordId: string, id: string): Promise<TenantDoc> {
  if (!Types.ObjectId.isValid(id)) throw AppError.notFound('Tenant not found');
  const tenant = await Tenant.findOne({ _id: id, landlordId, archivedAt: { $exists: false } });
  if (!tenant) throw AppError.notFound('Tenant not found');
  return tenant;
}

export async function listTenants(
  landlordId: string,
  propertyId?: string,
  scopePropertyIds: string[] | null = null,
  view: 'current' | 'evicted' | 'all' = 'current',
): Promise<TenantDTO[]> {
  let tenantIds: Types.ObjectId[] | undefined;
  let evictedLeaseIds: Types.ObjectId[] | undefined;
  if (view === 'current') {
    const leases = await Lease.find({ landlordId, status: 'active' }, { tenantId: 1 }).lean();
    tenantIds = leases.map((l) => l.tenantId as Types.ObjectId);
  }
  // Caretaker scope: only tenants with an active lease on assigned properties.
  if (scopePropertyIds) {
    const leases = await Lease.find(
      { landlordId, propertyId: { $in: scopePropertyIds }, status: 'active' },
      { tenantId: 1 },
    ).lean();
    tenantIds = leases.map((l) => l.tenantId as Types.ObjectId);
  }
  if (propertyId) {
    const propertyLeaseFilter =
      view === 'evicted'
        ? { landlordId, propertyId, status: 'ended', endReason: 'evicted' }
        : view === 'all'
          ? { landlordId, propertyId }
          : { landlordId, propertyId, status: 'active' };
    const leases = await Lease.find(propertyLeaseFilter, { tenantId: 1 }).lean();
    const ids = leases.map((l) => l.tenantId as Types.ObjectId);
    if (view === 'evicted') evictedLeaseIds = leases.map((l) => l._id as Types.ObjectId);
    tenantIds = tenantIds ? tenantIds.filter((t) => ids.some((i) => i.equals(t))) : ids;
  }
  const query: Record<string, unknown> = { landlordId, archivedAt: { $exists: false } };
  if (view === 'evicted') {
    query.evictedAt = { $exists: true };
    if (evictedLeaseIds) query.evictedLeaseId = { $in: evictedLeaseIds };
  }
  if (tenantIds) query._id = { $in: tenantIds };
  const tenants = await Tenant.find(query).sort({ createdAt: -1 });
  return Promise.all(tenants.map(async (t) => presentTenant(t, await tenantLeaseFacts(t.id))));
}

export async function evictTenant(
  landlordId: string,
  actor: Actor,
  id: string,
): Promise<TenantDTO> {
  const tenant = await ownedTenant(landlordId, id);
  const activeLeases = await Lease.find({
    landlordId,
    tenantId: tenant._id,
    status: 'active',
  }).limit(2);
  if (activeLeases.length === 0) throw AppError.conflict('Tenant has no active lease to end');
  if (activeLeases.length > 1)
    throw AppError.conflict('Tenant has multiple active leases; resolve them before eviction');
  await endLease(activeLeases[0]!.id, actor, 'evicted');
  return getTenant(landlordId, id);
}

export async function getTenant(landlordId: string, id: string): Promise<TenantDTO> {
  const tenant = await ownedTenant(landlordId, id);
  return presentTenant(tenant, await tenantLeaseFacts(tenant.id));
}

export async function tenantHistory(landlordId: string, id: string): Promise<PaymentDTO[]> {
  const tenant = await ownedTenant(landlordId, id);
  const payments = await Payment.find({ tenantId: tenant._id }).sort({ paidAt: -1 });
  return payments.map(presentPayment);
}

export async function createTenant(
  landlordId: string,
  actor: Actor,
  input: CreateTenantInput,
): Promise<TenantDTO> {
  return withTxn(async (session) => {
    const [tenant] = await Tenant.create(
      [
        {
          landlordId,
          addedBy: new Types.ObjectId(actor.userId),
          tenantName: input.fullName,
          phoneNumber: input.phone,
          ...(input.email ? { email: input.email } : {}),
          ...(input.notes ? { notes: input.notes } : {}),
        },
      ],
      { session },
    );
    await emitActivity(session, {
      actorId: actor.userId,
      actorName: actor.name,
      landlordId,
      action: 'tenant.added',
      entityId: tenant!._id,
      description: `Tenant ${tenant!.tenantName} added`,
    });
    return presentTenant(tenant!, { status: 'no-lease', lifecycle: 'unassigned' });
  });
}

export async function updateTenant(
  landlordId: string,
  actor: Actor,
  id: string,
  input: UpdateTenantInput,
): Promise<TenantDTO> {
  const tenant = await ownedTenant(landlordId, id);
  return withTxn(async (session) => {
    if (input.fullName) tenant.tenantName = input.fullName;
    if (input.phone) tenant.phoneNumber = input.phone;
    if (input.email !== undefined) tenant.email = input.email;
    if (input.notes !== undefined) tenant.notes = input.notes;
    await tenant.save({ session });
    await emitActivity(session, {
      actorId: actor.userId,
      actorName: actor.name,
      landlordId,
      action: 'tenant.updated',
      entityId: tenant._id,
      description: `Tenant ${tenant.tenantName} updated`,
    });
    return presentTenant(tenant, await tenantLeaseFacts(tenant.id));
  });
}

export async function archiveTenant(landlordId: string, actor: Actor, id: string): Promise<void> {
  const tenant = await ownedTenant(landlordId, id);
  await withTxn(async (session) => {
    tenant.set('archivedAt', new Date());
    await tenant.save({ session });
    await emitActivity(session, {
      actorId: actor.userId,
      actorName: actor.name,
      landlordId,
      action: 'tenant.updated',
      entityId: tenant._id,
      description: `Tenant ${tenant.tenantName} removed`,
    });
  });
}
