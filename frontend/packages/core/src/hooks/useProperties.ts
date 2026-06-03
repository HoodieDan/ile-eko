import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mockProperties } from '../api/mocks';
import type { Property } from '../types';

const USE_MOCKS = true;

export function useProperties() {
  return useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: async () => {
      if (USE_MOCKS) return mockProperties;
      // TODO: replace with api.get<Property[]>('/properties') once backend exists.
      return mockProperties;
    },
  });
}

export function useProperty(id: string | undefined) {
  return useQuery<Property | null>({
    queryKey: ['property', id],
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) return null;
      if (USE_MOCKS) return mockProperties.find((p) => p.id === id) ?? null;
      return mockProperties.find((p) => p.id === id) ?? null;
    },
  });
}

export interface SearchListingsInput {
  query?: string;
  area?: string;
  maxPrice?: number;
}

export function useSearchListings(input: SearchListingsInput) {
  return useQuery<Property[]>({
    queryKey: ['listings', input],
    queryFn: async () => {
      const q = input.query?.toLowerCase().trim();
      const area = input.area?.toLowerCase().trim();
      return mockProperties.filter((p) => {
        if (p.status !== 'vacant' && p.status !== 'partial') return false;
        if (area && !p.area.toLowerCase().includes(area)) return false;
        if (input.maxPrice && (p.rentAmount ?? 0) > input.maxPrice) return false;
        if (q) {
          const hay = `${p.propertyTitle} ${p.address} ${p.area} ${p.description}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    },
  });
}

export interface CreatePropertyInput {
  propertyTitle: string;
  address: string;
  area: string;
  lga: string;
  description: string;
  rentAmount?: number;
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_input: CreatePropertyInput) => {
      // TODO: replace with api.post('/properties', input) once backend exists.
      return { ok: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}
