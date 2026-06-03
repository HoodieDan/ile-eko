import { useQuery } from '@tanstack/react-query';
import { mockTenants } from '../api/mocks';
import type { Tenant } from '../types';

export function useTenants(propertyId?: string) {
  return useQuery<Tenant[]>({
    queryKey: ['tenants', propertyId ?? 'all'],
    queryFn: async () => {
      if (!propertyId) return mockTenants;
      return mockTenants.filter((t) => t.propertyId === propertyId);
    },
  });
}
