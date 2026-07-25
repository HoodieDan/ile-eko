import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, newIdempotencyKey } from '../api/client';

interface ListEnvelope<T> {
  items: T[];
  total?: number;
}

export interface CaretakerSummaryDTO {
  id: string;
  name: string;
  email?: string;
  status: 'active' | 'revoked' | 'pending';
  propertyCount: number;
  areas: string[];
}

export function useCaretakers() {
  return useQuery<CaretakerSummaryDTO[]>({
    queryKey: ['team', 'caretakers'],
    queryFn: async () => {
      const res = await api.get<ListEnvelope<CaretakerSummaryDTO>>('/team/caretakers');
      return res.items;
    },
  });
}

export interface CaretakerGrant {
  propertyId: string;
  role?: string;
  permissions?: string[];
}

export interface InviteCaretakerInput {
  name: string;
  email?: string;
  phone?: string;
  grants: CaretakerGrant[];
}

export function useInviteCaretaker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteCaretakerInput) =>
      api.post('/team/invite', input, { idempotencyKey: newIdempotencyKey() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
    },
  });
}
