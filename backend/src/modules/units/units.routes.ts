import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { actorFrom, landlordScope } from '../../utils/http';
import { CreateUnitInput, UpdateUnitInput } from '../../contracts';
import * as svc from './units.service';

/** Nested under /properties/:id/units. */
export const propertyUnitsRouter: Router = Router({ mergeParams: true });
propertyUnitsRouter.use(authenticate, requireRole('landlord', 'admin'));

propertyUnitsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await svc.listUnits(landlordScope(req), req.params.id as string);
    res.json({ items, total: items.length });
  }),
);

propertyUnitsRouter.post(
  '/',
  validate(CreateUnitInput),
  asyncHandler(async (req, res) => {
    const dto = await svc.createUnit(landlordScope(req), actorFrom(req), req.params.id as string, req.body);
    res.status(201).json(dto);
  }),
);

/** Top-level /units/:unitId. */
export const unitsRouter: Router = Router();
unitsRouter.use(authenticate, requireRole('landlord', 'admin'));

unitsRouter.patch(
  '/:unitId',
  validate(UpdateUnitInput),
  asyncHandler(async (req, res) => {
    res.json(await svc.updateUnit(landlordScope(req), actorFrom(req), req.params.unitId as string, req.body));
  }),
);

unitsRouter.delete(
  '/:unitId',
  asyncHandler(async (req, res) => {
    await svc.archiveUnit(landlordScope(req), actorFrom(req), req.params.unitId as string);
    res.json({ ok: true });
  }),
);
