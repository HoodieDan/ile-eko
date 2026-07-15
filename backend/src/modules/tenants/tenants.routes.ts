import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { actorFrom, landlordScope } from '../../utils/http';
import { CreateTenantInput, UpdateTenantInput } from '../../contracts';
import * as svc from './tenants.service';

export const tenantsRouter: Router = Router();
tenantsRouter.use(authenticate, requireRole('landlord', 'admin'));

tenantsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await svc.listTenants(landlordScope(req), req.query.propertyId as string | undefined);
    res.json({ items, total: items.length });
  }),
);

tenantsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const tenant = await svc.getTenant(landlordScope(req), req.params.id as string);
    const history = await svc.tenantHistory(landlordScope(req), req.params.id as string);
    res.json({ ...tenant, history });
  }),
);

tenantsRouter.post(
  '/',
  validate(CreateTenantInput),
  asyncHandler(async (req, res) => {
    res.status(201).json(await svc.createTenant(landlordScope(req), actorFrom(req), req.body));
  }),
);

tenantsRouter.patch(
  '/:id',
  validate(UpdateTenantInput),
  asyncHandler(async (req, res) => {
    res.json(await svc.updateTenant(landlordScope(req), actorFrom(req), req.params.id as string, req.body));
  }),
);

tenantsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await svc.archiveTenant(landlordScope(req), actorFrom(req), req.params.id as string);
    res.json({ ok: true });
  }),
);
