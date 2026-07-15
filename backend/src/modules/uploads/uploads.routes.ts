import { Router } from 'express';
import { Types } from 'mongoose';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { idempotent } from '../../middleware/idempotency';
import { landlordScope } from '../../utils/http';
import { AppError } from '../../utils/AppError';
import { FinalizeUploadInput, SignUploadInput } from '../../contracts';
import { Property, Tenant, Unit } from '../../models';
import { finalizeUpload, signUpload } from '../../services/storage';

export const uploadsRouter: Router = Router();
uploadsRouter.use(authenticate, requireRole('landlord', 'admin'));

/** Enforce the caller owns the resource the upload targets (§9). */
async function assertOwnsResource(landlordId: string, kind: string, resourceId: string): Promise<void> {
  if (!Types.ObjectId.isValid(resourceId)) throw AppError.notFound('Resource not found');
  if (kind === 'property') {
    if (!(await Property.findOne({ _id: resourceId, landlordId }).lean())) throw AppError.forbidden('Not your property');
  } else if (kind === 'unit') {
    const unit = await Unit.findById(resourceId).lean();
    if (!unit || !(await Property.findOne({ _id: unit.propertyId, landlordId }).lean()))
      throw AppError.forbidden('Not your unit');
  } else if (kind === 'receipt') {
    if (!(await Tenant.findOne({ _id: resourceId, landlordId }).lean())) throw AppError.forbidden('Not your tenant');
  }
  // avatar → self; no extra check
}

uploadsRouter.post(
  '/sign',
  validate(SignUploadInput),
  idempotent('upload.sign'),
  asyncHandler(async (req, res) => {
    const { kind, resourceId, contentType, sizeBytes } = req.body;
    await assertOwnsResource(landlordScope(req), kind, resourceId);
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
