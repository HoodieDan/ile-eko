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

export interface CaretakerMembershipDTO {
  id: string;
  propertyId: string;
  caretakerUserId: string;
  invitedBy: string;
  role: 'caretaker' | 'viewer';
  canLogPayments: boolean;
  canEditTenants: boolean;
  canUploadImages: boolean;
  canManageUnits: boolean;
  canEditProperty: boolean;
  status: 'active' | 'revoked';
  createdAt: string;
  updatedAt: string;
}

export function useCaretaker(id: string | undefined) {
  return useQuery<CaretakerMembershipDTO[]>({
    queryKey: ['team', 'caretaker', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await api.get<ListEnvelope<CaretakerMembershipDTO>>(`/team/caretakers/${id}`);
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

export interface UpdateCaretakerAccessInput {
  caretakerId: string;
  propertyId: string;
  permissions?: CaretakerPermissions;
  status?: 'active' | 'revoked';
}

export function useUpdateCaretakerAccess() {
  const qc = useQueryClient();
  return useMutation<CaretakerMembershipDTO, Error, UpdateCaretakerAccessInput>({
    mutationFn: ({ caretakerId, ...input }) =>
      api.patch<CaretakerMembershipDTO>(`/team/caretakers/${caretakerId}`, input),
    onSuccess: async (_membership, variables) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['team', 'caretakers'] }),
        qc.invalidateQueries({ queryKey: ['team', 'caretaker', variables.caretakerId] }),
        qc.invalidateQueries({ queryKey: ['activity'] }),
      ]);
    },
  });
}

export function useRevokeCaretakerAccess() {
  const qc = useQueryClient();
  return useMutation<CaretakerMembershipDTO[], Error, string>({
    mutationFn: async (caretakerId) => {
      const res = await api.post<ListEnvelope<CaretakerMembershipDTO>>(
        `/team/caretakers/${caretakerId}/revoke`,
      );
      return res.items;
    },
    onSuccess: async (_memberships, caretakerId) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['team', 'caretakers'] }),
        qc.invalidateQueries({ queryKey: ['team', 'caretaker', caretakerId] }),
        qc.invalidateQueries({ queryKey: ['activity'] }),
      ]);
    },
  });
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
