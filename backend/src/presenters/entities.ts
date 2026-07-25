import type {
  ActivityLogDoc,
  LeaseDoc,
  ObligationDoc,
  PaymentDoc,
  PropertyDoc,
  TenantDoc,
  UnitDoc,
} from '../models';
import type {
  ActivityAction,
  ActivityCategory,
  ActivityLogDTO,
  LeaseDTO,
  ObligationStatus,
  PaymentDTO,
  PropertyDTO,
  RentObligationDTO,
  TenantDTO,
  UnitDTO,
} from '../contracts';
import type { OccupancyStatus, PaymentFrequency, PaymentMethod } from '../contracts';
import type { TenantLeaseFacts } from '../services/stats';

const iso = (d: Date | string) => (typeof d === 'string' ? d : d.toISOString());
const dateOnly = (d: Date | string) => new Date(d).toISOString().slice(0, 10);

export function presentProperty(p: PropertyDoc, unitCount: number): PropertyDTO {
  return {
    id: p.id,
    landlordId: String(p.landlordId),
    propertyTitle: p.propertyTitle,
    address: p.address,
    area: p.area,
    lga: p.lga,
    propertyType: p.propertyType as PropertyDTO['propertyType'],
    description: p.description ?? '',
    images: p.images ?? [],
    hasUnits: Boolean(p.hasUnits),
    ...(p.bedrooms != null ? { bedrooms: p.bedrooms } : {}),
    ...(p.bathrooms != null ? { bathrooms: p.bathrooms } : {}),
    ...(p.sizeSqm != null ? { sizeSqm: p.sizeSqm } : {}),
    amenities: p.amenities ?? [],
    paymentFrequency: (p.paymentFrequency ?? 'annual') as PaymentFrequency,
    ...(p.rentAmount != null ? { rentAmount: p.rentAmount } : {}),
    verified: Boolean(p.verified),
    status: (p.statusCache ?? 'vacant') as OccupancyStatus,
    unitCount,
    createdAt: iso(p.createdAt as Date),
    updatedAt: iso(p.updatedAt as Date),
  };
}

export function presentUnit(u: UnitDoc): UnitDTO {
  return {
    id: u.id,
    propertyId: String(u.propertyId),
    label: u.unitNumber,
    bedrooms: u.bedrooms ?? 0,
    bathrooms: u.bathrooms ?? 0,
    ...(u.floor != null ? { floor: u.floor } : {}),
    ...(u.sizeSqm != null ? { sizeSqm: u.sizeSqm } : {}),
    rentAmount: u.rentAmount,
    paymentFrequency: (u.paymentFrequency ?? 'annual') as PaymentFrequency,
    amenities: u.amenities ?? [],
    images: u.images ?? [],
    status: (u.statusCache ?? 'vacant') as OccupancyStatus,
    createdAt: iso(u.createdAt as Date),
    updatedAt: iso(u.updatedAt as Date),
  };
}

export function presentTenant(t: TenantDoc, facts: TenantLeaseFacts): TenantDTO {
  return {
    id: t.id,
    fullName: t.tenantName,
    phone: t.phoneNumber,
    ...(t.email ? { email: t.email } : {}),
    ...(t.notes ? { notes: t.notes } : {}),
    ...(facts.propertyId ? { propertyId: facts.propertyId } : {}),
    ...(facts.leaseId ? { leaseId: facts.leaseId } : {}),
    ...(facts.unitId ? { unitId: facts.unitId } : {}),
    ...(facts.rentAmount != null ? { rentAmount: facts.rentAmount } : {}),
    ...(facts.paymentSchedule ? { paymentSchedule: facts.paymentSchedule as PaymentFrequency } : {}),
    ...(facts.leaseStartDate ? { leaseStartDate: facts.leaseStartDate } : {}),
    ...(facts.leaseEndDate ? { leaseEndDate: facts.leaseEndDate } : {}),
    ...(facts.paymentDueDate ? { paymentDueDate: facts.paymentDueDate } : {}),
    status: facts.status,
    ...(t.riskCache?.band
      ? {
          risk: {
            band: t.riskCache.band,
            score: t.riskCache.score ?? 0,
            reason: t.riskCache.reason ?? '',
            scoringVersion: t.riskCache.scoringVersion ?? 'v1',
          },
        }
      : {}),
    createdAt: iso(t.createdAt as Date),
    updatedAt: iso(t.updatedAt as Date),
  };
}

export function presentLease(l: LeaseDoc): LeaseDTO {
  return {
    id: l.id,
    tenantId: String(l.tenantId),
    propertyId: String(l.propertyId),
    ...(l.unitId ? { unitId: String(l.unitId) } : {}),
    startDate: dateOnly(l.startDate as Date),
    endDate: dateOnly(l.endDate as Date),
    billingAmount: l.billingAmount,
    annualizedRent: l.annualizedRent,
    schedule: l.schedule as PaymentFrequency,
    status: l.status as LeaseDTO['status'],
    createdAt: iso(l.createdAt as Date),
    updatedAt: iso(l.updatedAt as Date),
  };
}

/** Combine date-independent settlement with the query-time date component (§5.5b). */
export function obligationStatus(o: ObligationDoc, now: Date = new Date()): ObligationStatus {
  if (o.settlement === 'paid') return 'paid';
  if (o.settlement === 'partial') return 'partial';
  const due = new Date(o.dueDate);
  if (due < now) return 'overdue';
  const DAY = 86_400_000;
  if (due.getTime() - now.getTime() <= 30 * DAY) return 'due';
  return 'upcoming';
}

export function presentObligation(o: ObligationDoc): RentObligationDTO {
  return {
    id: o.id,
    leaseId: String(o.leaseId),
    tenantId: String(o.tenantId),
    propertyId: String(o.propertyId),
    ...(o.unitId ? { unitId: String(o.unitId) } : {}),
    periodStart: dateOnly(o.periodStart as Date),
    periodEnd: dateOnly(o.periodEnd as Date),
    dueDate: dateOnly(o.dueDate as Date),
    amountDue: o.amountDue,
    amountAllocated: o.amountAllocated,
    settlement: o.settlement as RentObligationDTO['settlement'],
    status: obligationStatus(o),
    createdAt: iso(o.createdAt as Date),
    updatedAt: iso(o.updatedAt as Date),
  };
}

export function presentPayment(p: PaymentDoc): PaymentDTO {
  return {
    id: p.id,
    tenantId: String(p.tenantId),
    leaseId: String(p.leaseId),
    amount: p.amount,
    paidAt: iso(p.paidAt as Date),
    method: p.method as PaymentMethod,
    ...(p.methodDetail ? { methodDetail: p.methodDetail } : {}),
    ...(p.periodCovered ? { periodCovered: p.periodCovered } : {}),
    ...(p.receiptKey ? { receiptKey: p.receiptKey } : {}),
    ...(p.reversalOfPaymentId ? { reversalOfPaymentId: String(p.reversalOfPaymentId) } : {}),
    ...(p.notes ? { notes: p.notes } : {}),
    createdAt: iso(p.createdAt as Date),
  };
}

export function presentActivity(a: ActivityLogDoc): ActivityLogDTO {
  return {
    id: a.id,
    actorId: String(a.actorId),
    actorName: a.actorName,
    action: a.action as ActivityAction,
    category: a.category as ActivityCategory,
    ...(a.propertyId ? { propertyId: String(a.propertyId) } : {}),
    ...(a.entityId ? { entityId: String(a.entityId) } : {}),
    description: a.description,
    ...(a.flag ? { flag: a.flag } : {}),
    createdAt: iso(a.createdAt as Date),
  };
}
