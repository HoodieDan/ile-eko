import { Router } from 'express';
import { Types } from 'mongoose';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';
import { attachOrg, orgOf } from '../../middleware/org';
import { validate } from '../../middleware/validate';
import { idempotent } from '../../middleware/idempotency';
import { AppError } from '../../utils/AppError';
import { propertyPermission } from '../../rbac/access';
import { FinalizeUploadInput, SignUploadInput } from '../../contracts';
import { Property, Tenant, Unit } from '../../models';
import { finalizeUpload, signUpload } from '../../services/storage';

export const uploadsRouter: Router = Router();
uploadsRouter.use(authenticate, requireRole('landlord', 'admin', 'caretaker'), attachOrg);

/** Enforce the caller owns/holds permission for the resource the upload targets (§9). */
async function assertUploadAccess(req: Parameters<typeof orgOf>[0], kind: string, resourceId: string): Promise<void> {
  const org = orgOf(req);
  if (!Types.ObjectId.isValid(resourceId)) throw AppError.notFound('Resource not found');

  const check = (pid: string) => {
    if (!propertyPermission(org, pid, 'canUploadImages')) throw AppError.forbidden('Not permitted');
  };

  if (kind === 'property') {
    const p = await Property.findOne({ _id: resourceId, landlordId: org.landlordId }).lean();
    if (!p) throw AppError.forbidden('Not your property');
    check(resourceId);
  } else if (kind === 'unit') {
    const unit = await Unit.findById(resourceId).lean();
    if (!unit) throw AppError.notFound('Unit not found');
    const p = await Property.findOne({ _id: unit.propertyId, landlordId: org.landlordId }).lean();
    if (!p) throw AppError.forbidden('Not your unit');
    check(String(unit.propertyId));
  } else if (kind === 'receipt') {
    const t = await Tenant.findOne({ _id: resourceId, landlordId: org.landlordId }).lean();
    if (!t) throw AppError.forbidden('Not your tenant');
    // receipts: caretakers with any log-payment right may attach; landlord always.
  }
  // avatar → self; no extra check.
}

uploadsRouter.post(
  '/sign',
  validate(SignUploadInput),
  idempotent('upload.sign'),
  asyncHandler(async (req, res) => {
    const { kind, resourceId, contentType, sizeBytes } = req.body;
    await assertUploadAccess(req, kind, resourceId);
    res.status(201).json(signUpload(kind, contentType, sizeBytes));
  }),
);

uploadsRouter.post(
  '/finalize',
  validate(FinalizeUploadInput),
  asyncHandler(async (req, res) => {
    res.json(await finalizeUpload(req.body.objectKey));
  }),
);
