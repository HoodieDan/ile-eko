import { Types } from 'mongoose';
import { Lease, Payment, Property, RentObligation, Unit } from '../models';
import type { DashboardSummaryNumbers, UpcomingRentItem } from '../contracts';

const DAY = 86_400_000;
const DUE_WINDOW_DAYS = 30;

function oid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

/** Money + occupancy aggregates for the dashboard & payments summary (§6.9). No N+1. */
export async function summaryNumbers(landlordId: string): Promise<DashboardSummaryNumbers> {
  const lid = oid(landlordId);
  const now = new Date();
  const dueEdge = new Date(now.getTime() + DUE_WINDOW_DAYS * DAY);

  const [collectedAgg] = await Payment.aggregate([
    { $match: { landlordId: lid } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const collected = collectedAgg?.total ?? 0;

  const [rollAgg] = await Lease.aggregate([
    { $match: { landlordId: lid, status: 'active' } },
    { $group: { _id: null, total: { $sum: '$annualizedRent' } } },
  ]);
  const rollAnnual = rollAgg?.total ?? 0;

  const obAgg = await RentObligation.aggregate([
    { $match: { landlordId: lid, settlement: { $ne: 'paid' } } },
    {
      $project: {
        outstanding: { $subtract: ['$amountDue', '$amountAllocated'] },
        overdue: { $lt: ['$dueDate', now] },
        due: { $and: [{ $gte: ['$dueDate', now] }, { $lte: ['$dueDate', dueEdge] }] },
      },
    },
    {
      $group: {
        _id: null,
        overdueAmt: { $sum: { $cond: ['$overdue', '$outstanding', 0] } },
        dueAmt: { $sum: { $cond: ['$due', '$outstanding', 0] } },
      },
    },
  ]);
  const overdueAmt = obAgg[0]?.overdueAmt ?? 0;
  const dueAmt = obAgg[0]?.dueAmt ?? 0;

  // Occupancy: units + standalone properties are the targets.
  const propIds = (await Property.find({ landlordId: lid, archivedAt: { $exists: false } }, { _id: 1, hasUnits: 1 }).lean());
  const standalone = propIds.filter((p) => !p.hasUnits);
  const unitAgg = await Unit.aggregate([
    { $match: { propertyId: { $in: propIds.map((p) => p._id) }, archivedAt: { $exists: false } } },
    { $group: { _id: '$statusCache', count: { $sum: 1 }, rent: { $sum: '$rentAmount' } } },
  ]);
  const standaloneDocs = await Property.find(
    { _id: { $in: standalone.map((p) => p._id) } },
    { statusCache: 1, rentAmount: 1 },
  ).lean();

  let occupied = 0;
  let total = 0;
  let vacantAmt = 0;
  for (const row of unitAgg) {
    total += row.count;
    if (row._id === 'occupied') occupied += row.count;
    if (row._id === 'vacant') vacantAmt += row.rent ?? 0;
  }
  for (const p of standaloneDocs) {
    total += 1;
    if (p.statusCache === 'occupied') occupied += 1;
    if (p.statusCache === 'vacant') vacantAmt += p.rentAmount ?? 0;
  }

  const occupancyPct = total ? Math.round((occupied / total) * 100) : 0;
  const denom = collected + overdueAmt + dueAmt;
  const collectedPct = denom ? Math.round((collected / denom) * 100) : 100;

  return { collected, rollAnnual, overdueAmt, dueAmt, vacantAmt, occupied, total, occupancyPct, collectedPct };
}

/** Upcoming/overdue rent list (top N), sorted overdue → due → upcoming. */
export async function upcomingRent(landlordId: string, limit = 5): Promise<UpcomingRentItem[]> {
  const now = new Date();
  const rows = await RentObligation.aggregate([
    { $match: { landlordId: oid(landlordId), settlement: { $ne: 'paid' } } },
    { $sort: { dueDate: 1 } },
    { $limit: 50 },
    { $lookup: { from: 'tenants', localField: 'tenantId', foreignField: '_id', as: 'tenant' } },
    { $lookup: { from: 'properties', localField: 'propertyId', foreignField: '_id', as: 'property' } },
    { $unwind: { path: '$tenant', preserveNullAndEmptyArrays: true } },
    { $unwind: { path: '$property', preserveNullAndEmptyArrays: true } },
  ]);

  const items: UpcomingRentItem[] = rows.map((r) => {
    const daysToDue = Math.round((new Date(r.dueDate).getTime() - now.getTime()) / DAY);
    const status: UpcomingRentItem['status'] =
      daysToDue < 0 ? 'overdue' : daysToDue <= DUE_WINDOW_DAYS ? 'due' : 'upcoming';
    return {
      tenantId: String(r.tenantId),
      tenantName: r.tenant?.tenantName ?? 'Tenant',
      propertyId: String(r.propertyId),
      propertyTitle: r.property?.propertyTitle ?? 'Property',
      dueDate: new Date(r.dueDate).toISOString().slice(0, 10),
      amount: r.amountDue - r.amountAllocated,
      status,
      daysToDue,
    };
  });

  const rank = { overdue: 0, due: 1, upcoming: 2 } as const;
  items.sort((a, b) => rank[a.status] - rank[b.status] || a.daysToDue - b.daysToDue);
  return items.slice(0, limit);
}

export type TenantLeaseFacts = {
  propertyId?: string;
  unitId?: string;
  leaseId?: string;
  rentAmount?: number;
  paymentSchedule?: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
  paymentDueDate?: string;
  status: 'up-to-date' | 'due' | 'overdue' | 'partial' | 'no-lease';
};

/** Derive a tenant's current-lease facts + status from the ledger. */
export async function tenantLeaseFacts(tenantId: string): Promise<TenantLeaseFacts> {
  const lease = await Lease.findOne({ tenantId: oid(tenantId), status: 'active' }).lean();
  if (!lease) return { status: 'no-lease' };

  const now = new Date();
  const obligations = await RentObligation.find({ leaseId: lease._id }).sort({ dueDate: 1 }).lean();
  const unpaid = obligations.filter((o) => o.settlement !== 'paid');
  const overdue = unpaid.some((o) => new Date(o.dueDate) < now);
  const partial = unpaid.some((o) => o.settlement === 'partial');
  const due = unpaid.some((o) => new Date(o.dueDate) >= now);
  const status: TenantLeaseFacts['status'] = overdue
    ? 'overdue'
    : partial
      ? 'partial'
      : due
        ? 'due'
        : 'up-to-date';
  const nextUnpaid = unpaid[0];

  return {
    propertyId: String(lease.propertyId),
    leaseId: String(lease._id),
    ...(lease.unitId ? { unitId: String(lease.unitId) } : {}),
    rentAmount: lease.billingAmount,
    paymentSchedule: lease.schedule,
    leaseStartDate: new Date(lease.startDate).toISOString().slice(0, 10),
    leaseEndDate: new Date(lease.endDate).toISOString().slice(0, 10),
    ...(nextUnpaid ? { paymentDueDate: new Date(nextUnpaid.dueDate).toISOString().slice(0, 10) } : {}),
    status,
  };
}
