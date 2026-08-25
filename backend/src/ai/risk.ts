import type { ClientSession } from 'mongoose';
import { Lease, Payment, PaymentAllocation, RentObligation, Tenant } from '../models';
import type { RiskBand } from '../contracts';
import { toDateOnly } from '../utils/date';

export const RISK_SCORING_VERSION = 'risk-v2';
const DAY = 86_400_000;

export interface RiskFeatures {
  totalObligations: number;
  paidObligations: number;
  overdueCount: number;
  maxDaysOverdue: number;
  latePaidCount: number;
  maxDaysLate: number;
  partialRatio: number;
  paidRatio: number;
}

export interface RiskResult {
  score: number;
  band: RiskBand;
  reason: string;
  scoringVersion: string;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function withSession<T extends { session: (session: ClientSession) => T }>(
  query: T,
  session?: ClientSession,
): T {
  return session ? query.session(session) : query;
}

function emptyFeatures(): RiskFeatures {
  return {
    totalObligations: 0,
    paidObligations: 0,
    overdueCount: 0,
    maxDaysOverdue: 0,
    latePaidCount: 0,
    maxDaysLate: 0,
    partialRatio: 0,
    paidRatio: 1,
  };
}

/**
 * Reconstruct when a currently-paid obligation crossed the fully-settled
 * threshold. This keeps a late payment in the risk history after its balance
 * reaches zero; settlement alone cannot tell on-time from late.
 */
async function paidLateness(
  obligations: Array<{ _id: unknown; dueDate: Date; amountDue: number; settlement: string }>,
  session?: ClientSession,
): Promise<{ latePaidCount: number; maxDaysLate: number }> {
  const paid = obligations.filter((obligation) => obligation.settlement === 'paid');
  if (paid.length === 0) return { latePaidCount: 0, maxDaysLate: 0 };

  const obligationIds = paid.map((obligation) => obligation._id);
  const allocationQuery = PaymentAllocation.find({ obligationId: { $in: obligationIds } }).lean();
  const allocations = await withSession(allocationQuery, session);
  const paymentIds = allocations.map((allocation) => allocation.paymentId);
  const paymentQuery = Payment.find({ _id: { $in: paymentIds } }, { paidAt: 1 }).lean();
  const payments = await withSession(paymentQuery, session);
  const paidAtByPayment = new Map(payments.map((payment) => [String(payment._id), payment.paidAt]));

  let latePaidCount = 0;
  let maxDaysLate = 0;
  for (const obligation of paid) {
    const ordered = allocations
      .filter((allocation) => String(allocation.obligationId) === String(obligation._id))
      .map((allocation) => ({
        amount: allocation.amount,
        paidAt: paidAtByPayment.get(String(allocation.paymentId)),
      }))
      .filter((allocation): allocation is { amount: number; paidAt: Date } =>
        Boolean(allocation.paidAt),
      )
      .sort((a, b) => a.paidAt.getTime() - b.paidAt.getTime());

    let allocated = 0;
    let settledAt: Date | undefined;
    for (const allocation of ordered) {
      const wasPaid = allocated >= obligation.amountDue;
      allocated += allocation.amount;
      const isPaid = allocated >= obligation.amountDue;
      if (!wasPaid && isPaid) settledAt = allocation.paidAt;
      if (wasPaid && !isPaid) settledAt = undefined;
    }

    if (!settledAt) continue;
    const daysLate = Math.floor(
      (toDateOnly(settledAt).getTime() - toDateOnly(obligation.dueDate).getTime()) / DAY,
    );
    if (daysLate > 0) {
      latePaidCount += 1;
      maxDaysLate = Math.max(maxDaysLate, daysLate);
    }
  }
  return { latePaidCount, maxDaysLate };
}

/** Deterministic features from the obligation/allocation/payment ledger. */
export async function computeRiskFeatures(
  tenantId: string,
  now: Date = new Date(),
  session?: ClientSession,
): Promise<RiskFeatures> {
  const leaseQuery = Lease.findOne({ tenantId, status: 'active' }).lean();
  const lease = await withSession(leaseQuery, session);
  if (!lease) {
    return emptyFeatures();
  }
  const obligationQuery = RentObligation.find({ leaseId: lease._id }).lean();
  const obligations = await withSession(obligationQuery, session);
  const total = obligations.length || 1;
  const paid = obligations.filter((o) => o.settlement === 'paid').length;
  const partial = obligations.filter((o) => o.settlement === 'partial').length;
  const overdue = obligations.filter((o) => o.settlement !== 'paid' && new Date(o.dueDate) < now);
  const history = await paidLateness(obligations, session);
  const maxDaysOverdue = overdue.reduce(
    (max, o) => Math.max(max, Math.floor((now.getTime() - new Date(o.dueDate).getTime()) / DAY)),
    0,
  );
  return {
    totalObligations: obligations.length,
    paidObligations: paid,
    overdueCount: overdue.length,
    maxDaysOverdue,
    ...history,
    partialRatio: partial / total,
    paidRatio: paid / total,
  };
}

/** Fully deterministic score + band; the explanation is derived from the same features. */
export function scoreRisk(f: RiskFeatures): { score: number; band: RiskBand } {
  const score = clamp01(
    0.45 * Math.min(1, f.overdueCount / 2) +
      0.2 * Math.min(1, f.maxDaysOverdue / 90) +
      0.25 * Math.min(1, f.latePaidCount) +
      0.1 * Math.min(1, f.maxDaysLate / 90) +
      0.05 * f.partialRatio +
      0.05 * (1 - f.paidRatio),
  );
  const band: RiskBand = score < 0.34 ? 'low' : score < 0.67 ? 'medium' : 'high';
  return { score: Math.round(score * 100) / 100, band };
}

export function deterministicRiskReason(f: RiskFeatures, band: RiskBand): string {
  if (f.overdueCount > 0) {
    return `${f.overdueCount} overdue payment${f.overdueCount > 1 ? 's' : ''}${
      f.maxDaysOverdue ? ` (up to ${f.maxDaysOverdue} days late)` : ''
    }.`;
  }
  if (f.partialRatio > 0) return 'Some periods only partially paid.';
  if (f.latePaidCount > 0) {
    return `${f.latePaidCount} payment${f.latePaidCount > 1 ? 's were' : ' was'} completed late${
      f.maxDaysLate
        ? ` (up to ${f.maxDaysLate} day${f.maxDaysLate === 1 ? '' : 's'} after the due date)`
        : ''
    }.`;
  }
  return band === 'low' ? 'Payments are up to date.' : 'Limited payment history.';
}

/** Persist the ledger-owned risk state, optionally inside the ledger transaction. */
export async function recomputeRiskDeterministic(
  tenantId: string,
  session?: ClientSession,
): Promise<RiskResult> {
  const features = await computeRiskFeatures(tenantId, new Date(), session);
  const { score, band } = scoreRisk(features);
  const result: RiskResult = {
    score,
    band,
    reason: deterministicRiskReason(features, band),
    scoringVersion: RISK_SCORING_VERSION,
  };
  const update = Tenant.updateOne(
    { _id: tenantId },
    { $set: { riskCache: { ...result, computedAt: new Date() } } },
  );
  await withSession(update, session);
  return result;
}

/**
 * Public/manual recompute uses the same ledger-owned calculation. The general
 * assistant may narrate this result, but it cannot replace the factual reason.
 */
export async function recomputeRisk(tenantId: string): Promise<RiskResult> {
  return recomputeRiskDeterministic(tenantId);
}
