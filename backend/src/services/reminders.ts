import { Lease, RentObligation, TaskRun } from '../models';
import { notify } from './notify';
import { recomputeRisk } from '../ai/risk';
import { logger } from '../config/logger';

const DAY = 86_400_000;

function localDate(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Daily sweep (§6.15a). Idempotent per day via TaskRun. Generates rent-due /
 * overdue notifications (upsert-keyed) and recomputes tenant risk. Does NOT
 * touch occupancy (that is synchronous in the lease transaction).
 */
export async function dailySweep(now = new Date()): Promise<{ skipped: boolean; notified: number; risk: number }> {
  const taskKey = `daily-sweep:${localDate(now)}`;
  try {
    await TaskRun.create({ taskKey });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) return { skipped: true, notified: 0, risk: 0 };
    throw err;
  }

  const soon = new Date(now.getTime() + 7 * DAY);
  let notified = 0;

  // Overdue + due-soon obligations → notify the landlord.
  const obligations = await RentObligation.find({
    settlement: { $ne: 'paid' },
    dueDate: { $lte: soon },
  })
    .limit(1000)
    .lean();

  for (const o of obligations) {
    const overdue = new Date(o.dueDate) < now;
    const created = await notify({
      userId: String(o.landlordId),
      type: overdue ? 'overdue' : 'rent-due',
      title: overdue ? 'Rent overdue' : 'Rent due soon',
      body: `₦${(o.amountDue - o.amountAllocated).toLocaleString()} ${overdue ? 'is overdue' : 'is due'}.`,
      deepLink: 'ileeko://payments',
      dedupeKey: `${overdue ? 'overdue' : 'rent-due'}:${o.landlordId}:${o._id}:${localDate(now)}`,
      propertyId: String(o.propertyId),
    });
    if (created) notified += 1;
  }

  // Recompute risk for tenants with active leases (bounded).
  const leases = await Lease.find({ status: 'active' }, { tenantId: 1 }).limit(1000).lean();
  let risk = 0;
  for (const l of leases) {
    try {
      await recomputeRisk(String(l.tenantId));
      risk += 1;
    } catch (err) {
      logger.warn({ err, tenantId: String(l.tenantId) }, 'risk recompute failed in sweep');
    }
  }

  return { skipped: false, notified, risk };
}
