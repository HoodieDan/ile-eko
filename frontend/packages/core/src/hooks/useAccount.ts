import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export interface UserLike {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatarUrl?: string;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AccountData = { user: UserLike; capabilities: string[] } & Record<string, unknown>;

export function useAccount() {
  return useQuery<AccountData>({
    queryKey: ['account'],
    queryFn: () => api.get<AccountData>('/account'),
  });
}

export interface PreferencesDTO {
  budgetMin?: number;
  budgetMax?: number;
  areas?: string[];
  sizeLabel?: string;
  bedrooms?: number;
}

export function usePreferences() {
  return useQuery<PreferencesDTO>({
    queryKey: ['account', 'preferences'],
    queryFn: () => api.get<PreferencesDTO>('/account/preferences'),
  });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PreferencesDTO) => api.patch('/account/preferences', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
}

export interface NotificationDTO {
  id: string;
  type: 'overdue' | 'activity' | 'ai' | 'rent-due' | 'lease';
  title: string;
  body: string;
  deepLink?: string;
  propertyId?: string;
  read: boolean;
  createdAt: string;
}

export function useNotifications() {
  return useQuery<{ items: NotificationDTO[]; unreadCount: number }>({
    queryKey: ['notifications'],
    queryFn: () =>
      api.get<{ items: NotificationDTO[]; unreadCount: number }>('/notifications'),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
