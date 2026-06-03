import React from 'react';
import { Pressable, View } from 'react-native';
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
  Icon,
  colors,
  type StatusKind,
} from '@ile-eko/ui';
import { allProperties, naira, nairaShort, type Property } from '@/data/mock';

type Occupancy = NonNullable<Property['occupancy']>;
type PropertyFilter = 'all' | Occupancy;

interface FilterDef {
  id: PropertyFilter;
  label: string;
}

const FILTERS: FilterDef[] = [
  { id: 'all', label: 'All' },
  { id: 'occupied', label: 'Occupied' },
  { id: 'vacant', label: 'Vacant' },
  { id: 'mixed', label: 'Multi-unit' },
];

/** Counts over allProperties by occupancy; "all" is the total. */
function buildCounts(): Record<PropertyFilter, number> {
  const counts: Record<PropertyFilter, number> = {
    all: allProperties.length,
    occupied: 0,
    vacant: 0,
    mixed: 0,
  };
  for (const p of allProperties) {
    if (p.occupancy) counts[p.occupancy] += 1;
  }
  return counts;
}

function matchesQuery(p: Property, query: string): boolean {
  const haystack = `${p.address} ${p.area} ${p.lga ?? ''} ${p.type}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export default function PropertiesScreen(): React.ReactElement {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState<PropertyFilter>('all');

  const counts = React.useMemo(buildCounts, []);

  const list = allProperties.filter(
    (p) => (filter === 'all' || p.occupancy === filter) && matchesQuery(p, query),
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
                <Text
                  variant="captionStrong"
                  color={active ? colors.onPrimary : colors.ink}
                >
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
          {list.length === 0 ? (
            <EmptyState
              icon="search"
              title="No matches"
              message={`Nothing found for "${query}".`}
            />
          ) : (
            list.map((p) => {
              const occupancy: StatusKind = p.occupancy ?? 'vacant';
              return (
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
                          {p.address}
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
                      <StatusChip status={occupancy} />
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
                        {p.multiUnit ? nairaShort(p.rent) : naira(p.rent)}
                        <Text variant="caption" color={colors.muted}>
                          {' '}
                          /yr
                        </Text>
                      </Text>
                      {p.multiUnit ? (
                        <Chip
                          tone="neutral"
                          icon="layers"
                          label={`${p.unitCount ?? 0} units`}
                        />
                      ) : (
                        <Chip tone="neutral" icon="home" label={p.type} />
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </View>

      <FABHost>
        <FAB
          label="Add Property"
          icon="plus"
          onPress={() => router.push('/properties/add')}
        />
      </FABHost>
    </Screen>
  );
}
