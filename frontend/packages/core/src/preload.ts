import type { QueryClient } from '@tanstack/react-query';
import { briefsQuery } from './hooks/useAI';
import { briefingQuery, dashboardQuery } from './hooks/useDashboard';
import { listingsQuery, recommendationsQuery, savedListingsQuery } from './hooks/useMarketplace';
import { propertiesQuery } from './hooks/useProperties';
import { tenantsQuery } from './hooks/useTenants';

/**
 * Warm the caches the first screen reads, so the branded splash hands over to a
 * populated dashboard instead of a page of spinners and empty-state copy.
 *
 * `allSettled`, deliberately: one failing endpoint must not hold the app at the
 * splash. Whatever didn't land falls back to the screen's own loading state.
 */
export async function prefetchLandlordBoot(qc: QueryClient): Promise<void> {
  await Promise.allSettled([
    qc.prefetchQuery(dashboardQuery()),
    qc.prefetchQuery(briefingQuery()),
    qc.prefetchQuery(propertiesQuery()),
    qc.prefetchQuery(tenantsQuery()),
    qc.prefetchQuery(briefsQuery()),
  ]);
}

/** Marketplace equivalent — what the explore tab needs to render fully. */
export async function prefetchTenantBoot(qc: QueryClient, authenticated: boolean): Promise<void> {
  await Promise.allSettled([
    qc.prefetchQuery(listingsQuery()),
    // Both of these are per-account and 401 when signed out.
    ...(authenticated
      ? [qc.prefetchQuery(recommendationsQuery()), qc.prefetchQuery(savedListingsQuery())]
      : []),
  ]);
}
