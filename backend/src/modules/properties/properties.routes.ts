import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';
import { attachOrg, orgOf } from '../../middleware/org';
import { validate } from '../../middleware/validate';
import { actorFrom } from '../../utils/http';
import { AppError } from '../../utils/AppError';
import { propertyPermission } from '../../rbac/access';
import { CreatePropertyInput, UpdatePropertyInput } from '../../contracts';
import * as svc from './properties.service';
import { listingsForProperty } from '../listings/listings.service';
import { rentSuggestion } from '../ai/ai.service';

export const propertiesRouter: Router = Router();

// Landlord + admin + caretaker (caretaker scoped to assigned properties).
propertiesRouter.use(authenticate, requireRole('landlord', 'admin', 'caretaker'), attachOrg);

propertiesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const org = orgOf(req);
    const items = await svc.listProperties(
      org.landlordId,
      {
        status: req.query.status as string | undefined,
        area: req.query.area as string | undefined,
        q: req.query.q as string | undefined,
      },
      org.propertyIds,
    );
    res.json({ items, total: items.length });
  }),
);

propertiesRouter.get(
  '/stats',
  requireRole('landlord', 'admin'),
  asyncHandler(async (req, res) => {
    res.json(await svc.propertyStats(orgOf(req).landlordId));
  }),
);

// AI smart pricing — landlord-only (§7.3). Registered before /:id-only paths is fine (distinct suffix).
propertiesRouter.get(
  '/:id/rent-suggestion',
  requireRole('landlord', 'admin'),
  asyncHandler(async (req, res) => {
    res.json(await rentSuggestion(orgOf(req).landlordId, req.params.id as string));
  }),
);

propertiesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const org = orgOf(req);
    const id = req.params.id as string;
    const dto = await svc.getProperty(org.landlordId, id, org.propertyIds);
    const listings = await listingsForProperty(org.landlordId, id);
    res.json({ ...dto, listings });
  }),
);

propertiesRouter.post(
  '/',
  requireRole('landlord', 'admin'),
  validate(CreatePropertyInput),
  asyncHandler(async (req, res) => {
    res.status(201).json(await svc.createProperty(orgOf(req).landlordId, actorFrom(req), req.body));
  }),
);

propertiesRouter.patch(
  '/:id',
  validate(UpdatePropertyInput),
  asyncHandler(async (req, res) => {
    const org = orgOf(req);
    const id = req.params.id as string;
    if (!propertyPermission(org, id, 'canEditProperty')) throw AppError.forbidden('Not permitted');
    res.json(await svc.updateProperty(org.landlordId, actorFrom(req), id, req.body));
  }),
);

propertiesRouter.delete(
  '/:id',
  requireRole('landlord', 'admin'), // destructive: landlord-only
  asyncHandler(async (req, res) => {
    await svc.archiveProperty(orgOf(req).landlordId, actorFrom(req), req.params.id as string);
    res.json({ ok: true });
  }),
);
