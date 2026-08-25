import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, newIdempotencyKey } from '../api/client';
import type { DashboardSummaryNumbers } from './useDashboard';
import { invalidateLedgerQueries } from './invalidateLedgerQueries';

export function usePaymentsSummary() {
  return useQuery<DashboardSummaryNumbers>({
    queryKey: ['payments', 'summary'],
    queryFn: () => api.get<DashboardSummaryNumbers>('/payments/summary'),
  });
}

export interface LogPaymentInput {
  leaseId: string;
  amount: number;
  paidAt?: string;
  method?: 'cash' | 'transfer' | 'card' | 'other';
  periodCovered?: string;
  receiptKey?: string;
  notes?: string;
}

export function useLogPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LogPaymentInput) =>
      api.post('/payments', input, { idempotencyKey: newIdempotencyKey() }),
    onSuccess: async () => {
      // Await active refetches so callers do not close their sheet onto stale data.
      await invalidateLedgerQueries(qc);
    },
  });
}
