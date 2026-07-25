import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen,
  Text,
  Button,
  SearchBar,
  PropertyThumb,
  StatusChip,
  Chip,
  EmptyState,
  FAB,
  FABHost,
  colors,
  type StatusKind,
} from '@ile-eko/ui';
import { useProperties, naira, nairaShort, type PropertyDTO } from '@ile-eko/core';

type PropertyFilter = 'all' | PropertyDTO['status'];

interface FilterDef {
  id: PropertyFilter;
  label: string;
}

const FILTERS: FilterDef[] = [
  { id: 'all', label: 'All' },
  { id: 'occupied', label: 'Occupied' },
  { id: 'vacant', label: 'Vacant' },
  { id: 'partial', label: 'Multi-unit' },
];

/** Occupancy → the payment-style chip the UI renders. */
function occupancyChip(status: PropertyDTO['status']): StatusKind {
  if (status === 'vacant') return 'vacant';
  if (status === 'partial') return 'due';
  return 'paid';
}

function matchesQuery(p: PropertyDTO, query: string): boolean {
  const haystack =
    `${p.propertyTitle} ${p.address} ${p.area} ${p.lga} ${p.propertyType}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export default function PropertiesScreen(): React.ReactElement {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState<PropertyFilter>('all');

  const { data: properties = [], isLoading } = useProperties();

  const counts = React.useMemo<Record<PropertyFilter, number>>(() => {
    const c: Record<PropertyFilter, number> = {
      all: properties.length,
      occupied: 0,
      vacant: 0,
      partial: 0,
    };
    for (const p of properties) c[p.status] += 1;
    return c;
  }, [properties]);

  const list = properties.filter(
    (p) => (filter === 'all' || p.status === filter) && matchesQuery(p, query),
  );

  return (
    <Screen scroll bottomSpace={120}>
      <View style={{ paddingHorizontal: 20, paddingTop: 6 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text variant="h1">Properties</Text>
          <Button
            title="Tenants"
            variant="secondary"
            size="sm"
            icon="users"
            fullWidth={false}
            onPress={() => router.push('/tenants')}
          />
        </View>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search address, area or LGA"
          containerStyle={{ marginTop: 16 }}
        />

        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            marginTop: 14,
          }}
        >
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                style={{
                  minHeight: 40,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderColor: active ? colors.primary : colors.line,
                  backgroundColor: active ? colors.primary : colors.surface,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 7,
                }}
              >
                <Text variant="captionStrong" color={active ? colors.onPrimary : colors.ink}>
                  {f.label}
                </Text>
                <Text
                  variant="caption"
                  color={active ? colors.onPrimary : colors.ink}
                  style={{ fontSize: 11, fontWeight: '700', opacity: 0.7 }}
                >
                  {counts[f.id]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: 18, gap: 12 }}>
          {isLoading ? (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : list.length === 0 ? (
            <EmptyState
              icon="search"
              title="No matches"
              message={query ? `Nothing found for "${query}".` : 'No properties yet.'}
            />
          ) : (
            list.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => router.push(`/properties/${p.id}`)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 13,
                  backgroundColor: colors.surface,
                  borderRadius: 18,
                  padding: 11,
                  transform: [{ scale: pressed ? 0.985 : 1 }],
                })}
              >
                <PropertyThumb size={64} radius={13} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        variant="title"
                        style={{ fontSize: 15.5, lineHeight: 19 }}
                        numberOfLines={1}
                      >
                        {p.propertyTitle}
                      </Text>
                      <Text
                        variant="caption"
                        color={colors.muted}
                        numberOfLines={1}
                        style={{ marginTop: 2 }}
                      >
                        {p.area} · {p.lga}
                      </Text>
                    </View>
                    <StatusChip status={occupancyChip(p.status)} />
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 9,
                    }}
                  >
                    <Text variant="bodyStrong" style={{ fontSize: 14.5 }}>
                      {p.hasUnits ? nairaShort(p.rentAmount ?? 0) : naira(p.rentAmount ?? 0)}
                      <Text variant="caption" color={colors.muted}>
                        {' '}
                        /yr
                      </Text>
                    </Text>
                    {p.hasUnits ? (
                      <Chip tone="neutral" icon="layers" label={`${p.unitCount} units`} />
                    ) : (
                      <Chip tone="neutral" icon="home" label={p.propertyType} />
                    )}
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </View>

      <FABHost>
        <FAB label="Add Property" icon="plus" onPress={() => router.push('/properties/add')} />
      </FABHost>
    </Screen>
  );
}
