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

/** Per-property caretaker permission flags (matches the API's CaretakerPermissions). */
export interface CaretakerPermissions {
  canLogPayments?: boolean;
  canEditTenants?: boolean;
  canUploadImages?: boolean;
  canManageUnits?: boolean;
  canEditProperty?: boolean;
}

export interface CaretakerGrant {
  propertyId: string;
  role?: 'caretaker' | 'viewer';
  permissions?: CaretakerPermissions;
}

export interface InviteCaretakerInput {
  name: string;
  email?: string;
  phone?: string;
  grants: CaretakerGrant[];
}

export interface InviteCaretakerResult {
  invitationId: string;
  token: string;
  shareUrl: string;
  /** False when mail isn't configured or was rejected — show `shareUrl` instead. */
  emailed: boolean;
  emailError?: string;
}

export function useInviteCaretaker() {
  const qc = useQueryClient();
  return useMutation<InviteCaretakerResult, Error, InviteCaretakerInput>({
    mutationFn: (input) =>
      api.post<InviteCaretakerResult>('/team/invite', input, {
        idempotencyKey: newIdempotencyKey(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
    },
  });
}
