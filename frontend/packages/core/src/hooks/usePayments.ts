import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Payment } from '../types';

export interface LogPaymentInput {
  tenantId: string;
  propertyId: string;
  unitId?: string;
  amount: number;
  amountPaid: number;
  method?: Payment['method'];
  notes?: string;
}

export function useLogPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_input: LogPaymentInput) => {
      // TODO: replace with api.post('/payments', input) once backend exists.
      return { ok: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}
