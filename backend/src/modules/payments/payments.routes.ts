import { Router } from 'express';
import type { Request } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';
import { attachOrg, orgOf } from '../../middleware/org';
import { validate } from '../../middleware/validate';
import { idempotent } from '../../middleware/idempotency';
import { actorFrom } from '../../utils/http';
import { AppError } from '../../utils/AppError';
import { propertyPermission } from '../../rbac/access';
import { LogPaymentInput } from '../../contracts';
import { Lease, Payment } from '../../models';
import { logPayment, reversePayment } from '../../services/ledger';
import { summaryNumbers } from '../../services/stats';
import { presentPayment } from '../../presenters/entities';

export const paymentsRouter: Router = Router();
paymentsRouter.use(authenticate, requireRole('landlord', 'admin', 'caretaker'), attachOrg);

async function leaseInOrg(req: Request, leaseId: string) {
  const lease = await Lease.findById(leaseId).lean();
  const org = orgOf(req);
  if (!lease || String(lease.landlordId) !== org.landlordId) throw AppError.notFound('Lease not found');
  if (org.isCaretaker && !org.propertyIds?.includes(String(lease.propertyId)))
    throw AppError.notFound('Lease not found');
  return lease;
}

// Payment list is revenue data — landlord-only.
paymentsRouter.get(
  '/',
  requireRole('landlord', 'admin'),
  asyncHandler(async (req, res) => {
    const query: Record<string, unknown> = { landlordId: orgOf(req).landlordId };
    if (req.query.tenantId) query.tenantId = req.query.tenantId;
    if (req.query.leaseId) query.leaseId = req.query.leaseId;
    const payments = await Payment.find(query).sort({ paidAt: -1 }).limit(200);
    res.json({ items: payments.map(presentPayment), total: payments.length });
  }),
);

paymentsRouter.get(
  '/summary',
  requireRole('landlord', 'admin'),
  asyncHandler(async (req, res) => {
    res.json(await summaryNumbers(orgOf(req).landlordId));
  }),
);

paymentsRouter.post(
  '/',
  validate(LogPaymentInput),
  idempotent('payment.log'),
  asyncHandler(async (req: Request, res) => {
    const lease = await leaseInOrg(req, req.body.leaseId);
    if (!propertyPermission(orgOf(req), String(lease.propertyId), 'canLogPayments'))
      throw AppError.forbidden('Not permitted to log payments here');
    const key = (req as Request & { idempotencyKey?: string }).idempotencyKey as string;
    const payment = await logPayment(req.body, actorFrom(req), key);
    res.status(201).json(presentPayment(payment));
  }),
);

// Reversal is a correction — landlord-only.
paymentsRouter.post(
  '/:id/reverse',
  requireRole('landlord', 'admin'),
  idempotent('payment.reverse'),
  asyncHandler(async (req, res) => {
    const original = await Payment.findById(req.params.id).lean();
    if (!original || String(original.landlordId) !== orgOf(req).landlordId)
      throw AppError.notFound('Payment not found');
    const reversal = await reversePayment(req.params.id as string, actorFrom(req));
    res.status(201).json(presentPayment(reversal));
  }),
);
