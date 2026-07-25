import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { PaymentFrequency } from '../types';

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

interface ListEnvelope<T> {
  items: T[];
  total?: number;
}

export function useTenants(propertyId?: string) {
  return useQuery<TenantDTO[]>({
    queryKey: ['tenants', propertyId ?? 'all'],
    queryFn: async () => {
      const res = await api.get<ListEnvelope<TenantDTO>>('/tenants', {
        query: propertyId ? { propertyId } : undefined,
      });
      return res.items;
    },
  });
}

export function useTenant(id: string | undefined) {
  return useQuery<TenantDetailDTO | null>({
    queryKey: ['tenant', id],
    enabled: Boolean(id),
    queryFn: () => api.get<TenantDetailDTO>(`/tenants/${id}`),
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
    mutationFn: (input: CreateTenantInput) => api.post<TenantDTO>('/tenants', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['properties'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
