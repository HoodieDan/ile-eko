import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { actorFrom, landlordScope } from '../../utils/http';
import { CreatePropertyInput, UpdatePropertyInput } from '../../contracts';
import * as svc from './properties.service';

export const propertiesRouter: Router = Router();

propertiesRouter.use(authenticate, requireRole('landlord', 'admin'));

propertiesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await svc.listProperties(landlordScope(req), {
      status: req.query.status as string | undefined,
      area: req.query.area as string | undefined,
      q: req.query.q as string | undefined,
    });
    res.json({ items, total: items.length });
  }),
);

propertiesRouter.get(
  '/stats',
  asyncHandler(async (req, res) => {
    res.json(await svc.propertyStats(landlordScope(req)));
  }),
);

propertiesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await svc.getProperty(landlordScope(req), req.params.id as string));
  }),
);

propertiesRouter.post(
  '/',
  validate(CreatePropertyInput),
  asyncHandler(async (req, res) => {
    const dto = await svc.createProperty(landlordScope(req), actorFrom(req), req.body);
    res.status(201).json(dto);
  }),
);

propertiesRouter.patch(
  '/:id',
  validate(UpdatePropertyInput),
  asyncHandler(async (req, res) => {
    res.json(await svc.updateProperty(landlordScope(req), actorFrom(req), req.params.id as string, req.body));
  }),
);

propertiesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await svc.archiveProperty(landlordScope(req), actorFrom(req), req.params.id as string);
    res.json({ ok: true });
  }),
);
