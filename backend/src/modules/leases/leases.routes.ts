import { Router } from 'express';
import { Types } from 'mongoose';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';
import { attachOrg, orgOf } from '../../middleware/org';
import { validate } from '../../middleware/validate';
import { actorFrom } from '../../utils/http';
import { AppError } from '../../utils/AppError';
import { propertyPermission } from '../../rbac/access';
import { CreateLeaseInput } from '../../contracts';
import { Lease, Property } from '../../models';
import { createLease, endLease } from '../../services/ledger';
import { presentLease } from '../../presenters/entities';

export const leasesRouter: Router = Router();
leasesRouter.use(authenticate, requireRole('landlord', 'admin', 'caretaker'), attachOrg);

leasesRouter.post(
  '/',
  validate(CreateLeaseInput),
  asyncHandler(async (req, res) => {
    const org = orgOf(req);
    const propertyId = req.body.propertyId as string;
    if (!Types.ObjectId.isValid(propertyId)) throw AppError.notFound('Property not found');
    const property = await Property.findOne({ _id: propertyId, landlordId: org.landlordId }).lean();
    if (!property) throw AppError.forbidden('Not your property');
    if (org.isCaretaker && !org.propertyIds?.includes(propertyId)) throw AppError.forbidden('Not your property');
    if (!propertyPermission(org, propertyId, 'canEditTenants')) throw AppError.forbidden('Not permitted');

    const lease = await createLease(req.body, actorFrom(req));
    res.status(201).json(presentLease(lease));
  }),
);

// Ending a lease produces a vacancy — landlord-only (§8).
leasesRouter.post(
  '/:id/end',
  requireRole('landlord', 'admin'),
  asyncHandler(async (req, res) => {
    const lease = await Lease.findById(req.params.id).lean();
    if (!lease || String(lease.landlordId) !== orgOf(req).landlordId) throw AppError.notFound('Lease not found');
    await endLease(req.params.id as string, actorFrom(req));
    res.json({ ok: true });
  }),
);
