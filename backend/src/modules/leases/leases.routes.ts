import { Router } from 'express';
import { Types } from 'mongoose';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { actorFrom, landlordScope } from '../../utils/http';
import { AppError } from '../../utils/AppError';
import { CreateLeaseInput } from '../../contracts';
import { Lease, Property } from '../../models';
import { createLease, endLease } from '../../services/ledger';
import { presentLease } from '../../presenters/entities';

export const leasesRouter: Router = Router();
leasesRouter.use(authenticate, requireRole('landlord', 'admin'));

async function assertOwnsProperty(landlordId: string, propertyId: string): Promise<void> {
  if (!Types.ObjectId.isValid(propertyId)) throw AppError.notFound('Property not found');
  const p = await Property.findOne({ _id: propertyId, landlordId }).lean();
  if (!p) throw AppError.forbidden('Not your property');
}

leasesRouter.post(
  '/',
  validate(CreateLeaseInput),
  asyncHandler(async (req, res) => {
    await assertOwnsProperty(landlordScope(req), req.body.propertyId);
    const lease = await createLease(req.body, actorFrom(req));
    res.status(201).json(presentLease(lease));
  }),
);

leasesRouter.post(
  '/:id/end',
  asyncHandler(async (req, res) => {
    const lease = await Lease.findById(req.params.id).lean();
    if (!lease || String(lease.landlordId) !== landlordScope(req)) throw AppError.notFound('Lease not found');
    await endLease(req.params.id as string, actorFrom(req));
    res.json({ ok: true });
  }),
);
