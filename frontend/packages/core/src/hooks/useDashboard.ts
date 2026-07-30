import { queryOptions, useQuery } from '@tanstack/react-query';
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

/** Shared so the boot preloader warms the exact same cache entry the screen reads. */
export const dashboardQuery = () =>
  queryOptions({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardData>('/dashboard/summary'),
  });

export function useDashboard() {
  return useQuery(dashboardQuery());
}

export interface Briefing {
  headline: string;
  points: string[];
  actionCount: number;
  degraded?: boolean;
}

export const briefingQuery = () =>
  queryOptions({
    queryKey: ['ai', 'briefing'],
    queryFn: () => api.get<Briefing>('/ai/briefing'),
    staleTime: 5 * 60_000,
  });

export function useBriefing() {
  return useQuery(briefingQuery());
}
