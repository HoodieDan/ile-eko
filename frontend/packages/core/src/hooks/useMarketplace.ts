import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

interface ListEnvelope<T> {
  items: T[];
  total?: number;
}

export type ListingFilters = {
  area?: string;
  maxPrice?: number;
  beds?: number;
  q?: string;
};

export interface ListingSummary {
  id: string;
  propertyId: string;
  unitId?: string;
  title: string;
  area: string;
  lga: string;
  rent: number;
  beds: number;
  baths: number;
  size: number;
  type: string;
  verified: boolean;
  amenities: string[];
  landlordName: string;
  listedAt?: string;
  saved?: boolean;
  recommended?: boolean;
  matchReason?: string;
}

export type ListingDetail = ListingSummary & {
  description: string;
  images: string[];
};

export function useListings(filters?: ListingFilters) {
  return useQuery<ListingSummary[]>({
    queryKey: ['listings', filters ?? {}],
    queryFn: async () => {
      const res = await api.get<ListEnvelope<ListingSummary>>('/listings', { query: filters });
      return res.items;
    },
  });
}

export function useListing(id?: string) {
  return useQuery<ListingDetail | null>({
    queryKey: ['listings', id],
    enabled: Boolean(id),
    queryFn: () => api.get<ListingDetail>(`/listings/${id}`),
  });
}

export function useRecordView() {
  return useMutation({
    mutationFn: ({ id, sessionId }: { id: string; sessionId?: string }) =>
      api.post(
        `/listings/${id}/view`,
        undefined,
        sessionId ? { headers: { 'X-Session-Id': sessionId } } : undefined,
      ),
  });
}

export function useToggleListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, listed }: { id: string; listed: boolean }) =>
      api.patch(`/listings/${id}`, { listed }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listings'] });
      qc.invalidateQueries({ queryKey: ['property'] });
    },
  });
}

export interface SearchResponse {
  filters: ListingFilters;
  results: ListingSummary[];
  degraded?: boolean;
}

export function useSearch() {
  return useMutation({
    mutationFn: (query: string) => api.post<SearchResponse>('/search', { query }),
  });
}

export function useRecommendations() {
  return useQuery<ListingSummary[]>({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const res = await api.get<ListEnvelope<ListingSummary>>('/recommendations');
      return res.items;
    },
  });
}

export function useSavedListings() {
  return useQuery<ListingSummary[]>({
    queryKey: ['saved-listings'],
    queryFn: async () => {
      const res = await api.get<ListEnvelope<ListingSummary>>('/saved-listings');
      return res.items;
    },
  });
}

export function useSaveListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (listingId: string) => api.post('/saved-listings', { listingId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved-listings'] });
      qc.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useUnsaveListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (listingId: string) => api.delete(`/saved-listings/${listingId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved-listings'] });
      qc.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}
