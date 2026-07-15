import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';
import { attachOrg, orgOf } from '../../middleware/org';
import { validate } from '../../middleware/validate';
import { actorFrom } from '../../utils/http';
import { AppError } from '../../utils/AppError';
import { anyPropertyPermission } from '../../rbac/access';
import { CreateTenantInput, UpdateTenantInput } from '../../contracts';
import * as svc from './tenants.service';
import { recomputeRisk } from '../../ai/risk';

export const tenantsRouter: Router = Router();
tenantsRouter.use(authenticate, requireRole('landlord', 'admin', 'caretaker'), attachOrg);

function assertCanEditTenants(req: Parameters<typeof orgOf>[0]): void {
  if (!anyPropertyPermission(orgOf(req), 'canEditTenants')) throw AppError.forbidden('Not permitted');
}

tenantsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const org = orgOf(req);
    const items = await svc.listTenants(
      org.landlordId,
      req.query.propertyId as string | undefined,
      org.propertyIds,
    );
    res.json({ items, total: items.length });
  }),
);

tenantsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const tenant = await svc.getTenant(orgOf(req).landlordId, req.params.id as string);
    const history = await svc.tenantHistory(orgOf(req).landlordId, req.params.id as string);
    res.json({ ...tenant, history });
  }),
);

tenantsRouter.post(
  '/',
  validate(CreateTenantInput),
  asyncHandler(async (req, res) => {
    assertCanEditTenants(req);
    res.status(201).json(await svc.createTenant(orgOf(req).landlordId, actorFrom(req), req.body));
  }),
);

tenantsRouter.patch(
  '/:id',
  validate(UpdateTenantInput),
  asyncHandler(async (req, res) => {
    assertCanEditTenants(req);
    res.json(await svc.updateTenant(orgOf(req).landlordId, actorFrom(req), req.params.id as string, req.body));
  }),
);

tenantsRouter.delete(
  '/:id',
  requireRole('landlord', 'admin'), // destructive: landlord-only
  asyncHandler(async (req, res) => {
    await svc.archiveTenant(orgOf(req).landlordId, actorFrom(req), req.params.id as string);
    res.json({ ok: true });
  }),
);

/** Force a risk recompute (also runs out-of-band on payment writes + daily sweep). */
tenantsRouter.post(
  '/:id/risk/recompute',
  requireRole('landlord', 'admin'),
  asyncHandler(async (req, res) => {
    // ensure the tenant belongs to the caller before computing
    await svc.getTenant(orgOf(req).landlordId, req.params.id as string);
    res.json(await recomputeRisk(req.params.id as string));
  }),
);
