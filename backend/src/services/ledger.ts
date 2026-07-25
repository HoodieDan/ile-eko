import mongoose, { type ClientSession, Types } from 'mongoose';
import { AppError } from '../utils/AppError';
import { addPeriod, toDateOnly } from '../utils/date';
import { PERIODS_PER_YEAR, type PaymentFrequency } from '../contracts';
import {
  Lease,
  Payment,
  PaymentAllocation,
  Property,
  RentObligation,
  Tenant,
  Unit,
  type LeaseDoc,
  type ObligationDoc,
  type PaymentDoc,
} from '../models';
import { emitActivity } from './activityLog';
import { emitEvent } from './outbox';
import { setTargetOccupancy } from './occupancy';
import { refreshListingProjection } from './listingProjection';

export interface Actor {
  userId: string;
  name: string;
}

function settlementFor(amountAllocated: number, amountDue: number): 'unallocated' | 'partial' | 'paid' {
  if (amountAllocated <= 0) return 'unallocated';
  if (amountAllocated >= amountDue) return 'paid';
  return 'partial';
}

/** Generate obligation rows for a lease's term (§5.5b). */
function buildObligations(lease: LeaseDoc): Array<Record<string, unknown>> {
  const schedule = lease.schedule as PaymentFrequency;
  const rows: Array<Record<string, unknown>> = [];
  let cursor = toDateOnly(lease.startDate);
  const end = toDateOnly(lease.endDate);
  let guard = 0;
  while (cursor < end && guard < 120) {
    const periodEnd = addPeriod(cursor, schedule);
    rows.push({
      leaseId: lease._id,
      landlordId: lease.landlordId,
      tenantId: lease.tenantId,
      propertyId: lease.propertyId,
      ...(lease.unitId ? { unitId: lease.unitId } : {}),
      periodStart: cursor,
      periodEnd,
      dueDate: cursor, // rent due at the start of each period
      amountDue: lease.billingAmount,
      amountAllocated: 0,
      settlement: 'unallocated',
    });
    cursor = periodEnd;
    guard += 1;
  }
  return rows;
}

/** Create a lease — invariants synchronous in one transaction (§5.5). */
export async function createLease(
  input: {
    tenantId: string;
    propertyId: string;
    unitId?: string;
    startDate: string;
    endDate: string;
    billingAmount: number;
    schedule: PaymentFrequency;
  },
  actor: Actor,
): Promise<LeaseDoc> {
  const property = await Property.findById(input.propertyId);
  if (!property) throw AppError.notFound('Property not found');
  const tenant = await Tenant.findById(input.tenantId);
  if (!tenant) throw AppError.notFound('Tenant not found');
  if (input.unitId) {
    const unit = await Unit.findOne({ _id: input.unitId, propertyId: property._id });
    if (!unit) throw AppError.notFound('Unit not found');
  }

  const session = await mongoose.startSession();
  try {
    let created!: LeaseDoc;
    await session.withTransaction(async () => {
      const annualizedRent = input.billingAmount * PERIODS_PER_YEAR[input.schedule];
      const [lease] = await Lease.create(
        [
          {
            landlordId: property.landlordId,
            tenantId: tenant._id,
            propertyId: property._id,
            ...(input.unitId ? { unitId: new Types.ObjectId(input.unitId) } : {}),
            startDate: toDateOnly(input.startDate),
            endDate: toDateOnly(input.endDate),
            billingAmount: input.billingAmount,
            annualizedRent,
            schedule: input.schedule,
            status: 'active',
            createdBy: new Types.ObjectId(actor.userId),
          },
        ],
        { session },
      );
      created = lease!;

      const obligations = buildObligations(created);
      if (obligations.length) await RentObligation.insertMany(obligations, { session });

      await setTargetOccupancy(session, property.id, input.unitId ?? null, true);
      await refreshListingProjection(session, property.id, input.unitId ?? null, false);

      await emitActivity(session, {
        actorId: actor.userId,
        actorName: actor.name,
        landlordId: property.landlordId,
        action: 'lease.created',
        propertyId: property._id,
        entityId: created._id,
        description: `Lease created for ${tenant.tenantName}`,
      });
      await emitEvent(session, {
        type: 'lease.created',
        payload: { leaseId: created.id, tenantId: tenant.id },
        dedupeKey: `lease.created:${created.id}`,
      });
    });
    return created;
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      throw AppError.conflict('That property/unit already has an active lease');
    }
    throw err;
  } finally {
    await session.endSession();
  }
}

/** End a lease → vacancy + re-list, synchronous (§5.5). */
export async function endLease(leaseId: string, actor: Actor): Promise<void> {
  const lease = await Lease.findById(leaseId);
  if (!lease || lease.status !== 'active') throw AppError.notFound('Active lease not found');

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      lease.status = 'ended';
      await lease.save({ session });

      // Cancel unpaid FUTURE obligations (no payment attached).
      await RentObligation.deleteMany(
        { leaseId: lease._id, settlement: 'unallocated', dueDate: { $gt: new Date() } },
        { session },
      );

      await setTargetOccupancy(session, String(lease.propertyId), lease.unitId ? String(lease.unitId) : null, false);
      await refreshListingProjection(
        session,
        String(lease.propertyId),
        lease.unitId ? String(lease.unitId) : null,
        true,
      );

      await emitActivity(session, {
        actorId: actor.userId,
        actorName: actor.name,
        landlordId: lease.landlordId,
        action: 'lease.ended',
        propertyId: lease.propertyId,
        entityId: lease._id,
        description: 'Lease ended',
      });
      await emitEvent(session, {
        type: 'lease.ended',
        payload: { leaseId: lease.id },
        dedupeKey: `lease.ended:${lease.id}`,
      });
    });
  } finally {
    await session.endSession();
  }
}

async function allocate(
  session: ClientSession,
  payment: PaymentDoc,
  amount: number,
  explicit?: Array<{ obligationId: string; amount: number }>,
): Promise<void> {
  let targets: Array<{ ob: ObligationDoc; take: number }> = [];

  if (explicit && explicit.length) {
    for (const a of explicit) {
      const ob = await RentObligation.findById(a.obligationId).session(session);
      if (ob && String(ob.leaseId) === String(payment.leaseId)) targets.push({ ob, take: a.amount });
    }
  } else {
    // oldest-due-first across open obligations
    const open = await RentObligation.find({
      leaseId: payment.leaseId,
      settlement: { $ne: 'paid' },
    })
      .sort({ dueDate: 1 })
      .session(session);
    let remaining = amount;
    for (const ob of open) {
      if (remaining <= 0) break;
      const need = ob.amountDue - ob.amountAllocated;
      const take = Math.min(remaining, need);
      if (take > 0) {
        targets.push({ ob, take });
        remaining -= take;
      }
    }
  }

  for (const { ob, take } of targets) {
    await PaymentAllocation.create(
      [{ paymentId: payment._id, obligationId: ob._id, amount: take }],
      { session },
    );
    ob.amountAllocated += take;
    ob.settlement = settlementFor(ob.amountAllocated, ob.amountDue);
    await ob.save({ session });
  }
}

/** Log a payment — short DB-only txn + outbox (§5.5c). Requires idempotencyKey. */
export async function logPayment(
  input: {
    leaseId: string;
    amount: number;
    paidAt?: string;
    method?: 'cash' | 'transfer' | 'card' | 'other';
    methodDetail?: string;
    periodCovered?: string;
    receiptKey?: string;
    notes?: string;
    allocateTo?: Array<{ obligationId: string; amount: number }>;
  },
  actor: Actor,
  idempotencyKey: string,
): Promise<PaymentDoc> {
  const lease = await Lease.findById(input.leaseId);
  if (!lease) throw AppError.notFound('Lease not found');

  const session = await mongoose.startSession();
  try {
    let payment!: PaymentDoc;
    await session.withTransaction(async () => {
      const [p] = await Payment.create(
        [
          {
            landlordId: lease.landlordId,
            tenantId: lease.tenantId,
            leaseId: lease._id,
            loggedBy: new Types.ObjectId(actor.userId),
            amount: input.amount,
            paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
            method: input.method ?? 'transfer',
            ...(input.methodDetail ? { methodDetail: input.methodDetail } : {}),
            ...(input.periodCovered ? { periodCovered: input.periodCovered } : {}),
            ...(input.receiptKey ? { receiptKey: input.receiptKey } : {}),
            ...(input.notes ? { notes: input.notes } : {}),
            idempotencyKey,
          },
        ],
        { session },
      );
      payment = p!;
      await allocate(session, payment, input.amount, input.allocateTo);

      await emitActivity(session, {
        actorId: actor.userId,
        actorName: actor.name,
        landlordId: lease.landlordId,
        action: 'payment.logged',
        propertyId: lease.propertyId,
        entityId: payment._id,
        description: `Payment of ₦${input.amount.toLocaleString()} logged`,
      });
      await emitEvent(session, {
        type: 'payment.logged',
        payload: { paymentId: payment.id, tenantId: String(lease.tenantId), leaseId: lease.id },
        dedupeKey: `payment.logged:${payment.id}`,
      });
    });
    return payment;
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      const existing = await Payment.findOne({ idempotencyKey });
      if (existing) return existing;
    }
    throw err;
  } finally {
    await session.endSession();
  }
}

/** Reverse a payment — a new offsetting row + offsetting allocations (§5.5c). */
export async function reversePayment(paymentId: string, actor: Actor): Promise<PaymentDoc> {
  const original = await Payment.findById(paymentId);
  if (!original) throw AppError.notFound('Payment not found');
  if (original.reversalOfPaymentId) throw AppError.badRequest('Cannot reverse a reversal');

  const session = await mongoose.startSession();
  try {
    let reversal!: PaymentDoc;
    await session.withTransaction(async () => {
      const [r] = await Payment.create(
        [
          {
            landlordId: original.landlordId,
            tenantId: original.tenantId,
            leaseId: original.leaseId,
            loggedBy: new Types.ObjectId(actor.userId),
            amount: -Math.abs(original.amount),
            paidAt: new Date(),
            method: original.method,
            reversalOfPaymentId: original._id,
            idempotencyKey: `reversal:${original.id}`,
          },
        ],
        { session },
      );
      reversal = r!;

      // Offset the original allocations.
      const allocations = await PaymentAllocation.find({ paymentId: original._id }).session(session);
      for (const a of allocations) {
        await PaymentAllocation.create(
          [{ paymentId: reversal._id, obligationId: a.obligationId, amount: -a.amount }],
          { session },
        );
        const ob = await RentObligation.findById(a.obligationId).session(session);
        if (ob) {
          ob.amountAllocated -= a.amount;
          ob.settlement = settlementFor(ob.amountAllocated, ob.amountDue);
          await ob.save({ session });
        }
      }

      await emitActivity(session, {
        actorId: actor.userId,
        actorName: actor.name,
        landlordId: original.landlordId,
        action: 'payment.reversed',
        propertyId: undefined,
        entityId: reversal._id,
        description: 'Payment reversed',
      });
      await emitEvent(session, {
        type: 'payment.reversed',
        payload: { paymentId: reversal.id, originalId: original.id },
        dedupeKey: `payment.reversed:${original.id}`,
      });
    });
    return reversal;
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      const existing = await Payment.findOne({ reversalOfPaymentId: original._id });
      if (existing) return existing;
    }
    throw err;
  } finally {
    await session.endSession();
  }
}
