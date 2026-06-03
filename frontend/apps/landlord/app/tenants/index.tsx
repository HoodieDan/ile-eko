import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
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
} from '@ile-eko/ui';
import { tenants, nairaShort, type Tenant } from '@/data/mock';

type FilterId = 'all' | 'current' | 'action';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'current', label: 'Up to date' },
  { id: 'action', label: 'Needs action' },
];

const ACTION_STATES: Tenant['status'][] = ['overdue', 'partial', 'pending', 'due'];

/** Drops the day component of a lease-end date, e.g. "09 Mar 2026" -> "Mar 2026". */
function leaseEndShort(leaseEnd: string): string {
  return leaseEnd.split(' ').slice(1).join(' ');
}

export default function TenantsScreen(): React.ReactElement {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');

  const list = useMemo<Tenant[]>(() => {
    const q = query.trim().toLowerCase();
    return tenants.filter((t) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'current' && t.status === 'paid') ||
        (filter === 'action' && ACTION_STATES.includes(t.status));
      const haystack = `${t.name} ${t.area}`.toLowerCase();
      return matchesFilter && haystack.includes(q);
    });
  }, [query, filter]);

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
        {list.length === 0 ? (
          <EmptyState icon="users" title="No tenants" message="Nothing matches here." />
        ) : (
          list.map((t) => (
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
              <Avatar initials={t.initials} size={46} />
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
                    {t.name}
                  </Text>
                  <Chip
                    label={t.risk.level}
                    tone="ai"
                    icon="spark"
                    style={{ flexShrink: 0 }}
                  />
                </View>
                <Text variant="caption" color={colors.muted} numberOfLines={1} style={{ marginTop: 2 }}>
                  {t.area}
                  {t.unit ? ` · ${t.unit}` : ''} · ends {leaseEndShort(t.leaseEnd)}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 9,
                  }}
                >
                  <Text variant="bodyStrong" style={{ fontSize: 13.5 }}>
                    {nairaShort(t.rent)}
                    <Text variant="caption" color={colors.muted}>
                      {' '}
                      /yr
                    </Text>
                  </Text>
                  <StatusChip status={t.status} />
                </View>
              </View>
            </Pressable>
          ))
        )}
      </View>
    </Screen>
  );
}
