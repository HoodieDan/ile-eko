import { Lease, RentObligation, Tenant } from '../models';
import { getEngine } from './engine';
import { withRetry } from './retry';
import type { RiskBand } from '../contracts';

const SCORING_VERSION = 'risk-v1';
const DAY = 86_400_000;

export interface RiskFeatures {
  totalObligations: number;
  paidObligations: number;
  overdueCount: number;
  maxDaysOverdue: number;
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

/** Deterministic features from the obligation/allocation ledger. */
export async function computeRiskFeatures(tenantId: string, now: Date = new Date()): Promise<RiskFeatures> {
  const lease = await Lease.findOne({ tenantId, status: 'active' }).lean();
  if (!lease) {
    return { totalObligations: 0, paidObligations: 0, overdueCount: 0, maxDaysOverdue: 0, partialRatio: 0, paidRatio: 1 };
  }
  const obligations = await RentObligation.find({ leaseId: lease._id }).lean();
  const total = obligations.length || 1;
  const paid = obligations.filter((o) => o.settlement === 'paid').length;
  const partial = obligations.filter((o) => o.settlement === 'partial').length;
  const overdue = obligations.filter((o) => o.settlement !== 'paid' && new Date(o.dueDate) < now);
  const maxDaysOverdue = overdue.reduce(
    (max, o) => Math.max(max, Math.floor((now.getTime() - new Date(o.dueDate).getTime()) / DAY)),
    0,
  );
  return {
    totalObligations: obligations.length,
    paidObligations: paid,
    overdueCount: overdue.length,
    maxDaysOverdue,
    partialRatio: partial / total,
    paidRatio: paid / total,
  };
}

/** Fully deterministic score + band (no model call). LLM only writes the reason. */
export function scoreRisk(f: RiskFeatures): { score: number; band: RiskBand } {
  const score = clamp01(
    0.45 * Math.min(1, f.overdueCount / 2) +
      0.25 * Math.min(1, f.maxDaysOverdue / 90) +
      0.2 * f.partialRatio +
      0.1 * (1 - f.paidRatio),
  );
  const band: RiskBand = score < 0.34 ? 'low' : score < 0.67 ? 'medium' : 'high';
  return { score: Math.round(score * 100) / 100, band };
}

function templateReason(f: RiskFeatures, band: RiskBand): string {
  if (f.overdueCount > 0) {
    return `${f.overdueCount} overdue payment${f.overdueCount > 1 ? 's' : ''}${
      f.maxDaysOverdue ? ` (up to ${f.maxDaysOverdue} days late)` : ''
    }.`;
  }
  if (f.partialRatio > 0) return 'Some periods only partially paid.';
  return band === 'low' ? 'Payments are up to date.' : 'Limited payment history.';
}

/** Recompute risk and persist to tenant.riskCache. LLM reason is best-effort. */
export async function recomputeRisk(tenantId: string): Promise<RiskResult> {
  const features = await computeRiskFeatures(tenantId);
  const { score, band } = scoreRisk(features);
  let reason = templateReason(features, band);

  // Optional: LLM writes a nicer one-line explanation of the ALREADY-decided band.
  if (process.env.AI_API_KEY) {
    try {
      reason = await withRetry(() =>
        getEngine().generateText({
          system:
            'You explain a tenant payment-risk assessment in one short sentence. Do not change the band; only explain it plainly.',
          prompt: `Band: ${band}. Features: ${JSON.stringify(features)}. Write one short reason.`,
        }),
      );
      reason = reason.trim().slice(0, 200) || templateReason(features, band);
    } catch {
      // keep template reason
    }
  }

  const result: RiskResult = { score, band, reason, scoringVersion: SCORING_VERSION };
  await Tenant.updateOne(
    { _id: tenantId },
    { $set: { riskCache: { ...result, computedAt: new Date() } } },
  );
  return result;
}
