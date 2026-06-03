import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mockEnquiries } from '../api/mocks';
import type { Enquiry } from '../types';

export function useEnquiries() {
  return useQuery<Enquiry[]>({
    queryKey: ['enquiries'],
    queryFn: async () => mockEnquiries,
  });
}

export interface SendEnquiryInput {
  propertyId: string;
  message: string;
}

export function useSendEnquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_input: SendEnquiryInput) => {
      // TODO: replace with api.post('/enquiries', input) once backend exists.
      return { ok: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enquiries'] });
    },
  });
}
