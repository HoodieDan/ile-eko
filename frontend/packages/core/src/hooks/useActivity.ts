import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

interface ListEnvelope<T> {
  items: T[];
  total?: number;
}

export interface ActivityLogDTO {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  category:
    | 'payment'
    | 'tenant'
    | 'property'
    | 'unit'
    | 'lease'
    | 'team'
    | 'enquiry'
    | 'image'
    | 'status'
    | 'maintenance';
  propertyId?: string;
  entityId?: string;
  description: string;
  flag?: string;
  createdAt: string;
}

export function useActivity(filters?: {
  category?: string;
  actorId?: string;
  propertyId?: string;
}) {
  return useQuery<ActivityLogDTO[]>({
    queryKey: ['activity', filters ?? {}],
    queryFn: async () => {
      const res = await api.get<ListEnvelope<ActivityLogDTO>>('/activity', { query: filters });
      return res.items;
    },
  });
}
