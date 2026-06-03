import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Screen,
  Text,
  Icon,
  Chip,
  Card,
  PropertyThumb,
  EmptyState,
  IconButton,
  colors,
  useToast,
} from '@ile-eko/ui';
import { listings, naira, nairaShort, areas, AM, savedIds, type AmenityKey, type Listing } from '@/data/mock';

/** Parsed natural-language filters. */
interface ParsedFilters {
  area?: string;
  beds?: number;
  budget?: number;
  amenity?: AmenityKey;
}

const AMENITY_PATTERNS: [AmenityKey, RegExp][] = [
  ['water', /water|borehole/],
  ['power', /power|light|electric/],
  ['security', /security|secure|gated/],
  ['parking', /parking|car/],
  ['furnished', /furnish/],
];

/** Natural-language query parser — mirrors the design's parseQuery. */
function parseQuery(q: string): ParsedFilters {
  const s = (q || '').toLowerCase();
  const f: ParsedFilters = {};

  const area = areas.find((a) => {
    const first = a.toLowerCase().split(' ')[0];
    return first !== undefined && s.includes(first);
  });
  if (area) f.area = area;

  const bed = s.match(/(\d+)\s*-?\s*bed/);
  if (bed && bed[1] !== undefined) f.beds = Number(bed[1]);

  const bud = s.match(/(?:under|below|max|up to)?\s*₦?\s*([\d.]+)\s*(k|m)/);
  if (bud && bud[1] !== undefined && bud[2] !== undefined) {
    f.budget = Math.round(parseFloat(bud[1]) * (bud[2] === 'm' ? 1e6 : 1e3));
  }

  const am = AMENITY_PATTERNS.find(([, re]) => re.test(s));
  if (am) f.amenity = am[0];

  return f;
}

/** Image-forward listing card matching the explore feed: thumb + heart + meta. */
function ListingCard({
  l,
  saved,
  onOpen,
  onToggleSave,
}: {
  l: Listing;
  saved: boolean;
  onOpen: (id: string) => void;
  onToggleSave: (id: string) => void;
}): React.ReactElement {
  return (
    <Card padding={0} onPress={() => onOpen(l.id)} style={{ overflow: 'hidden' }}>
      <View style={{ position: 'relative' }}>
        <PropertyThumb height={172} width="100%" radius={0} glyphSize={56} tag="listing photo" />
        {l.verified ? (
          <View style={{ position: 'absolute', top: 12, left: 12 }}>
            <Chip
              label="Verified"
              tone="ok"
              icon="checkCircle"
              style={{ backgroundColor: 'rgba(255,255,255,0.92)' }}
            />
          </View>
        ) : null}
        <Pressable
          onPress={() => onToggleSave(l.id)}
          hitSlop={8}
          style={{
            position: 'absolute',
            top: 11,
            right: 11,
            width: 38,
            height: 38,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.92)',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.22,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <Icon name="heart" size={19} color={saved ? colors.danger : colors.ink} fill={saved} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={{ paddingTop: 13, paddingHorizontal: 15, paddingBottom: 15 }}>
        <Text variant="title" style={{ fontSize: 16.5, lineHeight: 21 }} numberOfLines={1}>
          {l.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <Icon name="pin" size={12} color={colors.muted} />
          <Text variant="caption" color={colors.muted} numberOfLines={1}>
            {l.area} · {l.lga}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 11,
          }}
        >
          <Text variant="bodyStrong" style={{ fontSize: 18 }}>
            {naira(l.rent)}
            <Text variant="caption" color={colors.muted}>
              {' '}
              /yr
            </Text>
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Icon name="bed" size={15} color={colors.muted} />
              <Text variant="captionStrong" color={colors.muted}>
                {l.beds}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Icon name="bath" size={15} color={colors.muted} />
              <Text variant="captionStrong" color={colors.muted}>
                {l.baths}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Icon name="ruler" size={15} color={colors.muted} />
              <Text variant="captionStrong" color={colors.muted}>
                {l.size}m²
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
}

/** Dismissible interpreted-filter pill (iris/AI tone). */
function FilterPill({ label, onClear }: { label: string; onClear: () => void }): React.ReactElement {
  return (
    <Pressable
      onPress={onClear}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        minHeight: 36,
        paddingLeft: 13,
        paddingRight: 9,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: colors.ai,
        backgroundColor: colors.aiTint,
      }}
    >
      <Text variant="captionStrong" color={colors.aiDeep} style={{ fontSize: 13 }}>
        {label}
      </Text>
      <Icon name="x" size={14} color={colors.aiDeep} strokeWidth={2.4} />
    </Pressable>
  );
}

export default function Search(): React.ReactElement {
  const router = useRouter();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ q?: string }>();
  const initialQuery = typeof params.q === 'string' ? params.q : '';

  const [q, setQ] = useState(initialQuery);
  const [filters, setFilters] = useState<ParsedFilters>(() => parseQuery(initialQuery));
  const [saved, setSaved] = useState<Set<string>>(() => new Set(savedIds));

  const run = (text: string): void => {
    setQ(text);
    setFilters(parseQuery(text));
  };

  const clearKey = (k: keyof ParsedFilters): void => {
    setFilters((f) => {
      const n = { ...f };
      delete n[k];
      return n;
    });
  };

  const toggleSave = (id: string): void => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast('Removed from saved', 'heart');
      } else {
        next.add(id);
        showToast('Saved to your shortlist', 'heart');
      }
      return next;
    });
  };

  const results = useMemo(
    () =>
      listings.filter(
        (l) =>
          (!filters.area || l.area === filters.area) &&
          (!filters.beds || l.beds >= filters.beds) &&
          (!filters.budget || l.rent <= filters.budget) &&
          (!filters.amenity || l.amenities.includes(filters.amenity)),
      ),
    [filters],
  );

  const chips: { k: keyof ParsedFilters; label: string }[] = [];
  if (filters.area) chips.push({ k: 'area', label: filters.area });
  if (filters.beds) chips.push({ k: 'beds', label: `${filters.beds}+ beds` });
  if (filters.budget) chips.push({ k: 'budget', label: `≤ ${nairaShort(filters.budget)}` });
  if (filters.amenity) chips.push({ k: 'amenity', label: AM[filters.amenity].label });

  return (
    <Screen bottomSpace={120}>
      {/* Search header row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 4 }}>
        <IconButton name="back" variant="ghost" onPress={() => router.back()} />
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: 48,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: colors.line,
            backgroundColor: colors.surface,
            paddingHorizontal: 16,
          }}
        >
          <Icon name="search" size={18} color={colors.aiDeep} />
          <TextInput
            autoFocus
            value={q}
            onChangeText={setQ}
            onSubmitEditing={() => run(q)}
            returnKeyType="search"
            placeholder="Describe your ideal home…"
            placeholderTextColor="rgba(90,106,98,0.65)"
            autoCapitalize="none"
            autoCorrect={false}
            style={{ flex: 1, marginLeft: 10, color: colors.ink, fontSize: 15.5 }}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Interpreted filters */}
        {chips.length > 0 ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Icon name="spark" size={13} color={colors.aiDeep} fill />
              <Text variant="label" color={colors.aiDeep}>
                Understood as
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
              {chips.map((c) => (
                <FilterPill key={c.k} label={c.label} onClear={() => clearKey(c.k)} />
              ))}
            </View>
          </>
        ) : null}

        {/* Result count */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 13,
          }}
        >
          <Text variant="bodyStrong" style={{ fontSize: 15 }}>
            {results.length} {results.length === 1 ? 'home' : 'homes'}
          </Text>
          {chips.length > 0 ? (
            <Pressable onPress={() => run('')} hitSlop={8}>
              <Text variant="captionStrong" color={colors.primary} style={{ fontSize: 13 }}>
                Clear
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* Results */}
        {results.length === 0 ? (
          <EmptyState
            icon="search"
            title="No matches"
            message="Nothing fits all your filters. Try removing one above to widen your search."
            action={{ label: 'Widen search', onPress: () => run('') }}
            style={{ paddingTop: 30 }}
          />
        ) : (
          <View style={{ gap: 16 }}>
            {results.map((l) => (
              <ListingCard
                key={l.id}
                l={l}
                saved={saved.has(l.id)}
                onOpen={(id) => router.push(`/listing/${id}`)}
                onToggleSave={toggleSave}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
