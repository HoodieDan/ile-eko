import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
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
import {
  naira,
  nairaShort,
  useAuth,
  useListings,
  useSearch,
  useSaveListing,
  useUnsaveListing,
  type ListingSummary,
} from '@ile-eko/core';

/** Image-forward listing card matching the explore feed: thumb + heart + meta. */
function ListingCard({
  l,
  saved,
  onOpen,
  onToggleSave,
}: {
  l: ListingSummary;
  saved: boolean;
  onOpen: (id: string) => void;
  onToggleSave: (l: ListingSummary) => void;
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
          onPress={() => onToggleSave(l)}
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
          <Icon
            name="heart"
            size={19}
            color={saved ? colors.danger : colors.ink}
            fill={saved}
            strokeWidth={2}
          />
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
function FilterPill({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}): React.ReactElement {
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
  const { user } = useAuth();
  const params = useLocalSearchParams<{ q?: string }>();
  const initialQuery = typeof params.q === 'string' ? params.q : '';

  const [q, setQ] = useState(initialQuery);
  const [searched, setSearched] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const search = useSearch();
  const { data: allListings = [], isLoading: listingsLoading } = useListings();
  const saveListing = useSaveListing();
  const unsaveListing = useUnsaveListing();

  // Auto-run a search when arriving with a ?q= query (e.g. a quick chip on Explore).
  useEffect(() => {
    if (initialQuery.trim()) {
      setSearched(true);
      search.mutate(initialQuery.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = (): void => {
    setQ('');
    setSearched(false);
    setOverrides({});
    search.reset();
  };

  const runSearch = (text: string): void => {
    const query = text.trim();
    setQ(text);
    if (!query) {
      reset();
      return;
    }
    setSearched(true);
    setOverrides({});
    search.mutate(query);
  };

  const isSaved = (l: ListingSummary): boolean => overrides[l.id] ?? l.saved ?? false;

  const toggleSave = (l: ListingSummary): void => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    const currently = isSaved(l);
    setOverrides((o) => ({ ...o, [l.id]: !currently }));
    if (currently) {
      unsaveListing.mutate(l.id);
      showToast('Removed from saved', 'heart');
    } else {
      saveListing.mutate(l.id);
      showToast('Saved to your shortlist', 'heart');
    }
  };

  const filters = searched ? search.data?.filters : undefined;
  const results = searched ? (search.data?.results ?? []) : allListings;
  const loading = searched ? search.isPending : listingsLoading;

  const chips: { key: string; label: string }[] = [];
  if (filters?.area) chips.push({ key: 'area', label: filters.area });
  if (filters?.beds) chips.push({ key: 'beds', label: `${filters.beds}+ beds` });
  if (filters?.maxPrice) chips.push({ key: 'maxPrice', label: `≤ ${nairaShort(filters.maxPrice)}` });

  return (
    <Screen bottomSpace={120}>
      {/* Search header row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 20,
          paddingTop: 4,
        }}
      >
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
            onSubmitEditing={() => runSearch(q)}
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
                <FilterPill key={c.key} label={c.label} onClear={reset} />
              ))}
            </View>
          </>
        ) : null}

        {search.data?.degraded ? (
          <Text variant="caption" color={colors.muted} style={{ marginBottom: 12 }}>
            Showing keyword matches — smart search is briefly unavailable.
          </Text>
        ) : null}

        {/* Result count */}
        {loading ? null : (
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
            {searched ? (
              <Pressable onPress={reset} hitSlop={8}>
                <Text variant="captionStrong" color={colors.primary} style={{ fontSize: 13 }}>
                  Clear
                </Text>
              </Pressable>
            ) : null}
          </View>
        )}

        {/* Results */}
        {loading ? (
          <View style={{ paddingTop: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : results.length === 0 ? (
          <EmptyState
            icon="search"
            title="No matches"
            message="Nothing fits that search. Try describing your ideal home differently."
            action={{ label: 'Clear search', onPress: reset }}
            style={{ paddingTop: 30 }}
          />
        ) : (
          <View style={{ gap: 16 }}>
            {results.map((l) => (
              <ListingCard
                key={l.id}
                l={l}
                saved={isSaved(l)}
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
