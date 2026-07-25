import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';
import { attachOrg, orgOf } from '../../middleware/org';
import { validate } from '../../middleware/validate';
import { actorFrom } from '../../utils/http';
import { AppError } from '../../utils/AppError';
import { propertyPermission } from '../../rbac/access';
import { Unit } from '../../models';
import { CreateUnitInput, UpdateUnitInput } from '../../contracts';
import * as svc from './units.service';

async function propertyIdOfUnit(unitId: string): Promise<string> {
  const unit = await Unit.findById(unitId).lean();
  if (!unit) throw AppError.notFound('Unit not found');
  return String(unit.propertyId);
}

/** Nested under /properties/:id/units. */
export const propertyUnitsRouter: Router = Router({ mergeParams: true });
propertyUnitsRouter.use(authenticate, requireRole('landlord', 'admin', 'caretaker'), attachOrg);

propertyUnitsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await svc.listUnits(orgOf(req).landlordId, req.params.id as string);
    res.json({ items, total: items.length });
  }),
);

propertyUnitsRouter.post(
  '/',
  validate(CreateUnitInput),
  asyncHandler(async (req, res) => {
    const org = orgOf(req);
    if (!propertyPermission(org, req.params.id as string, 'canManageUnits')) throw AppError.forbidden('Not permitted');
    res.status(201).json(await svc.createUnit(org.landlordId, actorFrom(req), req.params.id as string, req.body));
  }),
);

/** Top-level /units/:unitId. */
export const unitsRouter: Router = Router();
unitsRouter.use(authenticate, requireRole('landlord', 'admin', 'caretaker'), attachOrg);

unitsRouter.patch(
  '/:unitId',
  validate(UpdateUnitInput),
  asyncHandler(async (req, res) => {
    const org = orgOf(req);
    const pid = await propertyIdOfUnit(req.params.unitId as string);
    if (!propertyPermission(org, pid, 'canManageUnits')) throw AppError.forbidden('Not permitted');
    res.json(await svc.updateUnit(org.landlordId, actorFrom(req), req.params.unitId as string, req.body));
  }),
);

unitsRouter.delete(
  '/:unitId',
  requireRole('landlord', 'admin'), // destructive: landlord-only
  asyncHandler(async (req, res) => {
    await svc.archiveUnit(orgOf(req).landlordId, actorFrom(req), req.params.unitId as string);
    res.json({ ok: true });
  }),
);
