import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

/** Matches the API DashboardSummary (§6.9) — field names mirror the screen's `summary`. */
export interface DashboardSummaryNumbers {
  collected: number;
  rollAnnual: number;
  overdueAmt: number;
  dueAmt: number;
  vacantAmt: number;
  occupied: number;
  total: number;
  occupancyPct: number;
  collectedPct: number;
}

export interface UpcomingRentItem {
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyTitle: string;
  dueDate: string;
  amount: number;
  status: 'overdue' | 'due' | 'upcoming';
  daysToDue: number;
}

export interface DashboardActivityItem {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  category: string;
  propertyId?: string;
  description: string;
  createdAt: string;
}

export interface DashboardData {
  summary: DashboardSummaryNumbers;
  upcoming: UpcomingRentItem[];
  enquiriesUnread: number;
  activity: DashboardActivityItem[];
}

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardData>('/dashboard/summary'),
  });
}

export interface Briefing {
  headline: string;
  points: string[];
  actionCount: number;
  degraded?: boolean;
}

export function useBriefing() {
  return useQuery<Briefing>({
    queryKey: ['ai', 'briefing'],
    queryFn: () => api.get<Briefing>('/ai/briefing'),
    staleTime: 5 * 60_000,
  });
}
