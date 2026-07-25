import { useMutation, useQuery } from '@tanstack/react-query';
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
  return useMutation({
    mutationFn: (input: AIChatInput) => api.post<AIChatResponse>('/ai/chat', input),
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

export interface AIBrief {
  kind: string;
  title: string;
  body: string;
  deepLink?: string;
}

export function useBriefs() {
  return useQuery<AIBrief[]>({
    queryKey: ['ai', 'briefs'],
    queryFn: async () => {
      const res = await api.get<ListEnvelope<AIBrief>>('/ai/briefs');
      return res.items;
    },
  });
}
