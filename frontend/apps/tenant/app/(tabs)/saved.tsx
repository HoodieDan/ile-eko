import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen,
  Text,
  Chip,
  Icon,
  PropertyThumb,
  EmptyState,
  useToast,
  colors,
} from '@ile-eko/ui';
import { listings, savedIds, naira, type Listing } from '@/data/mock';

interface SaveHeartProps {
  on: boolean;
  onToggle: () => void;
}

function SaveHeart({ on, onToggle }: SaveHeartProps): React.ReactElement {
  return (
    <Pressable
      onPress={onToggle}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={on ? 'Remove from saved' : 'Save home'}
      style={{
        width: 38,
        height: 38,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.92)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <Icon name="heart" size={19} color={on ? colors.danger : colors.ink} fill={on} strokeWidth={2} />
    </Pressable>
  );
}

interface SavedCardProps {
  listing: Listing;
  onOpen: () => void;
  onToggleSave: () => void;
}

function SavedCard({ listing, onOpen, onToggleSave }: SavedCardProps): React.ReactElement {
  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderRadius: 20,
        overflow: 'hidden',
        transform: [{ scale: pressed ? 0.985 : 1 }],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 18,
        elevation: 2,
      })}
    >
      <View style={{ position: 'relative' }}>
        <PropertyThumb height={172} width="100%" radius={0} glyphSize={48} tag="listing photo" />
        {listing.verified ? (
          <View style={{ position: 'absolute', top: 12, left: 12 }}>
            <Chip
              label="Verified"
              tone="ok"
              icon="checkCircle"
              style={{ backgroundColor: 'rgba(255,255,255,0.92)' }}
            />
          </View>
        ) : null}
        <View style={{ position: 'absolute', top: 11, right: 11 }}>
          <SaveHeart on onToggle={onToggleSave} />
        </View>
      </View>

      <View style={{ paddingHorizontal: 15, paddingTop: 13, paddingBottom: 15 }}>
        <Text variant="title" style={{ fontSize: 16.5, lineHeight: 21 }} numberOfLines={1}>
          {listing.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <Icon name="pin" size={12} color={colors.muted} />
          <Text variant="caption" color={colors.muted} numberOfLines={1} style={{ flex: 1 }}>
            {listing.area} · {listing.lga}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 11,
          }}
        >
          <Text variant="bodyStrong" style={{ fontSize: 18 }}>
            {naira(listing.rent)}
            <Text variant="caption" color={colors.muted}>
              {' '}
              /yr
            </Text>
          </Text>
          <View style={{ flexDirection: 'row', gap: 13 }}>
            <Fact icon="bed" value={String(listing.beds)} />
            <Fact icon="bath" value={String(listing.baths)} />
            <Fact icon="ruler" value={`${listing.size}m²`} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function Fact({ icon, value }: { icon: 'bed' | 'bath' | 'ruler'; value: string }): React.ReactElement {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Icon name={icon} size={15} color={colors.muted} />
      <Text variant="captionStrong" color={colors.muted}>
        {value}
      </Text>
    </View>
  );
}

export default function Saved(): React.ReactElement {
  const router = useRouter();
  const { showToast } = useToast();
  const [saved, setSaved] = useState<Set<string>>(() => new Set(savedIds));

  const savedListings = useMemo(
    () => listings.filter((l) => saved.has(l.id)),
    [saved],
  );

  const unsave = (listing: Listing): void => {
    setSaved((prev) => {
      const next = new Set(prev);
      next.delete(listing.id);
      return next;
    });
    showToast(`Removed ${listing.title} from saved`, 'heart');
  };

  return (
    <Screen scroll bottomSpace={120}>
      <View style={{ paddingHorizontal: 20, paddingTop: 6 }}>
        <Text variant="h1">Saved</Text>
        <Text variant="body" color={colors.muted} style={{ marginTop: 3 }}>
          {savedListings.length} {savedListings.length === 1 ? 'home' : 'homes'} shortlisted
        </Text>

        {savedListings.length === 0 ? (
          <EmptyState
            icon="heart"
            title="No saved homes yet"
            message="Tap the heart on any listing to shortlist it here."
            action={{ label: 'Explore homes', onPress: () => router.push('/explore') }}
            style={{ paddingTop: 50 }}
          />
        ) : (
          <View style={{ marginTop: 18, gap: 16 }}>
            {savedListings.map((l) => (
              <SavedCard
                key={l.id}
                listing={l}
                onOpen={() => router.push(`/listing/${l.id}`)}
                onToggleSave={() => unsave(l)}
              />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}
