import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { PaymentFrequency } from '../types';
import { invalidateLedgerQueries } from './invalidateLedgerQueries';

export interface TenantRiskDTO {
  band: 'low' | 'medium' | 'high';
  score: number;
  reason: string;
  scoringVersion: string;
}

export interface TenantDTO {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
  propertyId?: string;
  unitId?: string;
  leaseId?: string;
  rentAmount?: number;
  paymentSchedule?: PaymentFrequency;
  leaseStartDate?: string;
  leaseEndDate?: string;
  paymentDueDate?: string;
  status: 'up-to-date' | 'due' | 'overdue' | 'partial' | 'no-lease';
  lifecycle: 'current' | 'unassigned' | 'evicted';
  previousPropertyId?: string;
  previousUnitId?: string;
  risk?: TenantRiskDTO;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentReceiptDTO {
  id: string;
  tenantId: string;
  leaseId: string;
  amount: number;
  paidAt: string;
  method: 'cash' | 'transfer' | 'card' | 'other';
  periodCovered?: string;
  receiptKey?: string;
  notes?: string;
  createdAt: string;
}

export type TenantDetailDTO = TenantDTO & { history: PaymentReceiptDTO[] };

/**
 * One-release compatibility shape. Older deployed APIs predate `lifecycle`,
 * while the current mobile UI uses it to separate current, unassigned and
 * evicted people. Normalize at the shared boundary so every consumer sees the
 * same complete contract during a staggered backend/app rollout.
 */
type TenantWireDTO = Omit<TenantDTO, 'lifecycle'> & {
  lifecycle?: TenantDTO['lifecycle'];
};

function normalizeTenant(tenant: TenantWireDTO): TenantDTO {
  const lifecycle =
    tenant.lifecycle ??
    (tenant.previousPropertyId
      ? 'evicted'
      : tenant.leaseId || tenant.propertyId || tenant.status !== 'no-lease'
        ? 'current'
        : 'unassigned');
  return { ...tenant, lifecycle };
}

interface ListEnvelope<T> {
  items: T[];
  total?: number;
}

export type TenantListView = 'current' | 'evicted' | 'all';

export const tenantsQuery = (propertyId?: string, view: TenantListView = 'current') =>
  queryOptions({
    queryKey: ['tenants', propertyId ?? 'all', view],
    queryFn: async () => {
      const res = await api.get<ListEnvelope<TenantWireDTO>>('/tenants', {
        query: {
          ...(propertyId ? { propertyId } : {}),
          ...(view !== 'current' ? { view } : {}),
        },
      });
      return res.items.map(normalizeTenant);
    },
  });

export function useTenants(propertyId?: string, view: TenantListView = 'current') {
  return useQuery(tenantsQuery(propertyId, view));
}

export function useTenant(id: string | undefined) {
  return useQuery<TenantDetailDTO | null>({
    queryKey: ['tenant', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const tenant = await api.get<TenantWireDTO & { history: PaymentReceiptDTO[] }>(
        `/tenants/${id}`,
      );
      return { ...normalizeTenant(tenant), history: tenant.history };
    },
  });
}

export interface CreateTenantInput {
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTenantInput) =>
      normalizeTenant(await api.post<TenantWireDTO>('/tenants', input)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export type UpdateTenantInput = Partial<CreateTenantInput>;

export function useUpdateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateTenantInput }) =>
      normalizeTenant(await api.patch<TenantWireDTO>(`/tenants/${id}`, input)),
    onSuccess: async (_tenant, variables) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['tenant', variables.id] }),
        qc.invalidateQueries({ queryKey: ['tenants'] }),
        qc.invalidateQueries({ queryKey: ['activity'] }),
      ]);
    },
  });
}

export function useEvictTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      normalizeTenant(await api.post<TenantWireDTO>(`/tenants/${id}/evict`)),
    onSuccess: async () => {
      await invalidateLedgerQueries(qc);
    },
  });
}

export interface CreateLeaseInput {
  tenantId: string;
  propertyId: string;
  unitId?: string;
  startDate: string;
  endDate: string;
  billingAmount: number;
  schedule: PaymentFrequency;
}

export function useCreateLease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLeaseInput) => api.post('/leases', input),
    onSuccess: async () => {
      await invalidateLedgerQueries(qc);
    },
  });
}
