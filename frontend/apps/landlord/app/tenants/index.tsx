import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen,
  AppBar,
  Text,
  SearchBar,
  Avatar,
  StatusChip,
  Chip,
  EmptyState,
  IconButton,
  colors,
  spacing,
  radii,
  type StatusKind,
} from '@ile-eko/ui';
import {
  useTenants,
  useProperties,
  initialsOf,
  nairaShort,
  type TenantDTO,
} from '@ile-eko/core';

type FilterId = 'all' | 'current' | 'action';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'current', label: 'Up to date' },
  { id: 'action', label: 'Needs action' },
];

const ACTION_STATES: TenantDTO['status'][] = ['overdue', 'partial', 'due'];

const RISK_LABEL: Record<NonNullable<TenantDTO['risk']>['band'], string> = {
  low: 'Low',
  medium: 'Watch',
  high: 'High',
};

/** Tenant lifecycle status → the status pill the UI renders. */
export function tenantChip(status: TenantDTO['status']): StatusKind {
  if (status === 'up-to-date') return 'paid';
  if (status === 'no-lease') return 'vacant';
  return status;
}

/** Short "Mon YYYY" for a lease-end date, e.g. "2026-03-09" -> "Mar 2026". */
function monthYear(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-NG', { month: 'short', year: 'numeric' });
}

export default function TenantsScreen(): React.ReactElement {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');

  const { data: tenants = [], isLoading } = useTenants();
  const { data: properties = [] } = useProperties();

  const areaById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of properties) map.set(p.id, p.area);
    return map;
  }, [properties]);

  const list = useMemo<TenantDTO[]>(() => {
    const q = query.trim().toLowerCase();
    return tenants.filter((t) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'current' && t.status === 'up-to-date') ||
        (filter === 'action' && ACTION_STATES.includes(t.status));
      const area = (t.propertyId && areaById.get(t.propertyId)) || '';
      const haystack = `${t.fullName} ${area}`.toLowerCase();
      return matchesFilter && haystack.includes(q);
    });
  }, [tenants, query, filter, areaById]);

  return (
    <Screen scroll padded bottomSpace={120}>
      <AppBar
        title="Tenants"
        onBack={() => router.back()}
        right={
          <IconButton name="plus" variant="surface" onPress={() => router.push('/tenants/add')} />
        }
      />

      <View style={{ marginTop: spacing.sm }}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search tenants" />
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={{
                minHeight: 40,
                paddingHorizontal: spacing.lg,
                justifyContent: 'center',
                borderRadius: radii.pill,
                borderWidth: 1.5,
                borderColor: active ? colors.primary : colors.line,
                backgroundColor: active ? colors.primary : colors.surface,
              }}
            >
              <Text
                variant="bodyStrong"
                color={active ? colors.onPrimary : colors.ink}
                style={{ fontSize: 13 }}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
        {isLoading ? (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : list.length === 0 ? (
          <EmptyState icon="users" title="No tenants" message="Nothing matches here." />
        ) : (
          list.map((t) => {
            const area = (t.propertyId && areaById.get(t.propertyId)) || '';
            const end = monthYear(t.leaseEndDate);
            const subtitle = [area, end ? `ends ${end}` : '']
              .filter(Boolean)
              .join(' · ');
            return (
              <Pressable
                key={t.id}
                onPress={() => router.push(`/tenants/${t.id}`)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: 14,
                  borderRadius: radii.card,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.line,
                }}
              >
                <Avatar initials={initialsOf(t.fullName)} size={46} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: spacing.sm,
                    }}
                  >
                    <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                      {t.fullName}
                    </Text>
                    {t.risk ? (
                      <Chip
                        label={RISK_LABEL[t.risk.band]}
                        tone="ai"
                        icon="spark"
                        style={{ flexShrink: 0 }}
                      />
                    ) : null}
                  </View>
                  {subtitle ? (
                    <Text
                      variant="caption"
                      color={colors.muted}
                      numberOfLines={1}
                      style={{ marginTop: 2 }}
                    >
                      {subtitle}
                    </Text>
                  ) : null}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 9,
                    }}
                  >
                    <Text variant="bodyStrong" style={{ fontSize: 13.5 }}>
                      {nairaShort(t.rentAmount ?? 0)}
                      <Text variant="caption" color={colors.muted}>
                        {' '}
                        /yr
                      </Text>
                    </Text>
                    <StatusChip status={tenantChip(t.status)} />
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </View>
    </Screen>
  );
}
