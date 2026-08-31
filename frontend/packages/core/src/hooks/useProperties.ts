import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { PaymentFrequency, PropertyType } from '../types';

/** Property DTO as returned by the API (§5.2 serialized). */
export interface PropertyDTO {
  id: string;
  landlordId: string;
  propertyTitle: string;
  address: string;
  area: string;
  lga: string;
  propertyType: PropertyType;
  description: string;
  images: string[];
  hasUnits: boolean;
  bedrooms?: number;
  bathrooms?: number;
  sizeSqm?: number;
  amenities: string[];
  paymentFrequency: PaymentFrequency;
  rentAmount?: number;
  verified: boolean;
  status: 'vacant' | 'occupied' | 'partial';
  unitCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ListEnvelope<T> {
  items: T[];
  total?: number;
}

export const propertiesQuery = (filters?: { status?: string; area?: string; q?: string }) =>
  queryOptions({
    queryKey: ['properties', filters ?? {}],
    queryFn: async () => {
      const res = await api.get<ListEnvelope<PropertyDTO>>('/properties', { query: filters });
      return res.items;
    },
  });

export function useProperties(filters?: { status?: string; area?: string; q?: string }) {
  return useQuery(propertiesQuery(filters));
}

export interface PropertyStats {
  all: number;
  occupied: number;
  vacant: number;
  partial: number;
}

export function usePropertyStats() {
  return useQuery<PropertyStats>({
    queryKey: ['properties', 'stats'],
    queryFn: () => api.get<PropertyStats>('/properties/stats'),
  });
}

export function useProperty(id: string | undefined) {
  return useQuery<(PropertyDTO & { listings?: unknown[] }) | null>({
    queryKey: ['property', id],
    enabled: Boolean(id),
    queryFn: () => api.get(`/properties/${id}`),
  });
}

export interface CreatePropertyInput {
  propertyTitle: string;
  address: string;
  area: string;
  lga: string;
  propertyType: PropertyType;
  description?: string;
  paymentFrequency?: PaymentFrequency;
  rentAmount?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  hasUnits?: boolean;
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePropertyInput) => api.post<PropertyDTO>('/properties', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export type UpdatePropertyInput = Partial<CreatePropertyInput> & { images?: string[] };

export function useUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePropertyInput }) =>
      api.patch<PropertyDTO>(`/properties/${id}`, input),
    onSuccess: async (_property, variables) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['property', variables.id] }),
        qc.invalidateQueries({ queryKey: ['properties'] }),
        qc.invalidateQueries({ queryKey: ['dashboard'] }),
        qc.invalidateQueries({ queryKey: ['listings'] }),
      ]);
    },
  });
}
