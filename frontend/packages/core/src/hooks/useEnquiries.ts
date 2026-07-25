import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, newIdempotencyKey } from '../api/client';

interface ListEnvelope<T> {
  items: T[];
  total?: number;
  unreadCount?: number;
}

export interface EnquiryReply {
  authorId: string;
  body: string;
  createdAt: string;
}

/** Landlord-facing enquiry as returned by the inbox endpoints. */
export interface EnquiryInboxDTO {
  id: string;
  listingId: string;
  targetLabel: string;
  tenantName: string;
  message: string;
  snippet: string;
  read: boolean;
  status: 'new' | 'replied' | 'closed';
  replies: EnquiryReply[];
  createdAt: string;
}

/** Tenant-facing enquiry as returned by `/enquiries/mine`. */
export interface EnquiryDTO {
  id: string;
  tenantUserId: string;
  listingId: string;
  propertyId: string;
  message: string;
  status: 'new' | 'replied' | 'closed';
  createdAt: string;
  reply?: string;
}

// ── Landlord inbox ─────────────────────────────────────────────────────────

export function useEnquiryInbox() {
  return useQuery<{ items: EnquiryInboxDTO[]; unreadCount: number }>({
    queryKey: ['enquiries'],
    queryFn: () =>
      api.get<{ items: EnquiryInboxDTO[]; unreadCount: number }>('/enquiries'),
  });
}

export function useEnquiryThread(id?: string) {
  return useQuery<EnquiryInboxDTO | null>({
    queryKey: ['enquiries', id],
    enabled: Boolean(id),
    queryFn: () => api.get<EnquiryInboxDTO>(`/enquiries/${id}`),
  });
}

export function useReplyEnquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      api.post(`/enquiries/${id}/replies`, { body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enquiries'] });
    },
  });
}

export function useMarkEnquiryRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/enquiries/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enquiries'] });
    },
  });
}

// ── Tenant side ────────────────────────────────────────────────────────────

export function useMyEnquiries() {
  return useQuery<EnquiryDTO[]>({
    queryKey: ['enquiries', 'mine'],
    queryFn: async () => {
      const res = await api.get<ListEnvelope<EnquiryDTO>>('/enquiries/mine');
      return res.items;
    },
  });
}

export interface SendEnquiryInput {
  listingId: string;
  message: string;
}

export function useSendEnquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SendEnquiryInput) =>
      api.post('/enquiries', input, { idempotencyKey: newIdempotencyKey() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enquiries', 'mine'] });
    },
  });
}
