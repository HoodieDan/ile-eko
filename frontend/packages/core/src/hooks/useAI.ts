import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { AIConversation } from '../types';

interface ListEnvelope<T> {
  items: T[];
  total?: number;
}

export interface AIChatInput {
  message: string;
  conversationId?: string;
}

export interface AIChatResponse {
  conversationId: string;
  message: string;
  degraded?: boolean;
}

export function useAIChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AIChatInput) => api.post<AIChatResponse>('/ai/chat', input),
    onSuccess: () => {
      // A reply may have created (or retitled) a conversation — refresh history.
      qc.invalidateQueries({ queryKey: ['ai', 'conversations'] });
    },
  });
}

export function useConversations() {
  return useQuery<AIConversation[]>({
    queryKey: ['ai', 'conversations'],
    queryFn: async () => {
      const res = await api.get<ListEnvelope<AIConversation>>('/ai/conversations');
      return res.items;
    },
  });
}

/** Full message history for one conversation — used to resume a past chat. */
export function useConversation(id: string | undefined) {
  return useQuery<AIConversation | null>({
    queryKey: ['ai', 'conversation', id],
    enabled: Boolean(id),
    queryFn: () => api.get<AIConversation>(`/ai/conversations/${id}`),
  });
}

export interface AIBrief {
  kind: string;
  title: string;
  body: string;
  deepLink?: string;
}

export const briefsQuery = () =>
  queryOptions({
    queryKey: ['ai', 'briefs'],
    queryFn: async () => {
      const res = await api.get<ListEnvelope<AIBrief>>('/ai/briefs');
      return res.items;
    },
  });

export function useBriefs() {
  return useQuery(briefsQuery());
}
