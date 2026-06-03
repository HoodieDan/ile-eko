import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Avatar,
  Chip,
  Eyebrow,
  Icon,
  PropertyThumb,
  Screen,
  Text,
  colors,
  radii,
  spacing,
  useToast,
} from '@ile-eko/ui';
import { listings, naira, profile, savedIds, type Listing } from '@/data/mock';

const QUICK = ['Under ₦1M', '2 bedroom', '3 bedroom', 'Yaba', 'Lekki', 'Good water'] as const;

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 14 },
  shadowOpacity: 0.08,
  shadowRadius: 24,
  elevation: 3,
} as const;

export default function Explore(): React.ReactElement {
  const router = useRouter();
  const { showToast } = useToast();
  const [saved, setSaved] = useState<Set<string>>(() => new Set(savedIds));

  const firstName = profile.name.split(' ')[0] ?? profile.name;
  const recommended = listings.filter((l) => l.recommended);

  const toggleSave = (id: string, title: string): void => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast(`Removed ${title}`, 'heart');
      } else {
        next.add(id);
        showToast(`Saved ${title}`, 'heart');
      }
      return next;
    });
  };

  return (
    <Screen scroll padded bottomSpace={120} contentContainerStyle={{ paddingTop: spacing.xs }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, minWidth: 0, paddingRight: spacing.md }}>
          <Text variant="body" color={colors.muted} style={{ fontSize: 13 }}>
            Good afternoon, {firstName}
          </Text>
          <Text variant="h1" style={{ marginTop: 2, fontSize: 26 }}>
            Find your home
          </Text>
        </View>
        <Avatar initials={profile.initials} size={42} tone="accent" />
      </View>

      {/* Natural-language search entry → /search */}
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/search')}
        style={({ pressed }) => [
          {
            marginTop: spacing.lg,
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 11,
            backgroundColor: colors.surface,
            borderWidth: 1.5,
            borderColor: colors.line,
            borderRadius: radii.lg,
            paddingVertical: 14,
            paddingHorizontal: 15,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          },
          CARD_SHADOW,
        ]}
      >
        <Icon name="search" size={20} color={colors.aiDeep} style={{ marginTop: 1 }} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="bodyStrong" style={{ fontSize: 14.5 }}>
            Describe your ideal home
          </Text>
          <Text variant="caption" color={colors.muted} style={{ marginTop: 2, lineHeight: 18 }}>
            “3-bedroom in Yaba under ₦800k with good water”
          </Text>
        </View>
      </Pressable>

      {/* Quick-query chips → /search */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -spacing.xl, marginTop: spacing.md }}
        contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.xl, paddingBottom: 2 }}
      >
        {QUICK.map((q) => (
          <Pressable
            key={q}
            accessibilityRole="button"
            onPress={() => router.push('/search')}
            style={({ pressed }) => ({
              minHeight: 38,
              justifyContent: 'center',
              paddingHorizontal: 14,
              borderRadius: radii.pill,
              borderWidth: 1.5,
              borderColor: colors.line,
              backgroundColor: pressed ? colors.surface2 : colors.surface,
            })}
          >
            <Text variant="captionStrong" color={colors.ink} style={{ fontSize: 13 }}>
              {q}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Recommended for you */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: spacing['2xl'],
          marginBottom: spacing.md,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="spark" size={13} color={colors.aiDeep} fill />
          <Eyebrow color={colors.aiDeep}>Recommended for you</Eyebrow>
        </View>
        <Text variant="caption" color={colors.muted}>
          From your preferences
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -spacing.xl }}
        contentContainerStyle={{ gap: spacing.md, paddingHorizontal: spacing.xl, paddingBottom: spacing.xs }}
      >
        {recommended.map((l) => (
          <Pressable
            key={l.id}
            accessibilityRole="button"
            onPress={() => router.push(`/listing/${l.id}`)}
            style={({ pressed }) => [
              {
                width: 230,
                borderRadius: radii.card,
                backgroundColor: colors.aiTint,
                overflow: 'hidden',
                transform: [{ scale: pressed ? 0.985 : 1 }],
              },
            ]}
          >
            <View>
              <PropertyThumb height={120} width="100%" radius={0} glyphSize={42} />
              <View style={{ position: 'absolute', top: 10, left: 10 }}>
                <Chip label="Match" tone="ai" icon="spark" solid />
              </View>
            </View>
            <View style={{ padding: 13 }}>
              <Text variant="bodyStrong" style={{ fontSize: 14.5 }} numberOfLines={1}>
                {l.title}
              </Text>
              <Text variant="caption" color={colors.muted} style={{ marginTop: 2 }} numberOfLines={1}>
                {l.area} · {naira(l.rent)}/yr
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Newest vacant homes feed */}
      <Text variant="h2" style={{ marginTop: spacing['2xl'], marginBottom: 13, fontSize: 19 }}>
        Newest vacant homes
      </Text>
      <View style={{ gap: spacing.lg }}>
        {listings.map((l) => (
          <ListingCard
            key={l.id}
            listing={l}
            saved={saved.has(l.id)}
            onOpen={() => router.push(`/listing/${l.id}`)}
            onToggleSave={() => toggleSave(l.id, l.title)}
          />
        ))}
      </View>
    </Screen>
  );
}

interface ListingCardProps {
  listing: Listing;
  saved: boolean;
  onOpen: () => void;
  onToggleSave: () => void;
}

function ListingCard({ listing, saved, onOpen, onToggleSave }: ListingCardProps): React.ReactElement {
  const l = listing;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onOpen}
      style={({ pressed }) => [
        {
          backgroundColor: colors.surface,
          borderRadius: radii.card,
          overflow: 'hidden',
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
        CARD_SHADOW,
      ]}
    >
      <View>
        <PropertyThumb height={172} width="100%" radius={0} glyphSize={56} />
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
        <View style={{ position: 'absolute', top: 11, right: 11 }}>
          <SaveHeart on={saved} onToggle={onToggleSave} />
        </View>
      </View>

      <View style={{ padding: 15, paddingTop: 13 }}>
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
          <FactRow listing={l} />
        </View>
      </View>
    </Pressable>
  );
}

function FactRow({ listing }: { listing: Listing }): React.ReactElement {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Icon name="bed" size={15} color={colors.muted} />
        <Text variant="captionStrong" color={colors.muted} style={{ fontSize: 12.5 }}>
          {listing.beds}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Icon name="bath" size={15} color={colors.muted} />
        <Text variant="captionStrong" color={colors.muted} style={{ fontSize: 12.5 }}>
          {listing.baths}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Icon name="ruler" size={15} color={colors.muted} />
        <Text variant="captionStrong" color={colors.muted} style={{ fontSize: 12.5 }}>
          {listing.size}m²
        </Text>
      </View>
    </View>
  );
}

interface SaveHeartProps {
  on: boolean;
  onToggle: () => void;
}

function SaveHeart({ on, onToggle }: SaveHeartProps): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={on ? 'Remove from saved' : 'Save home'}
      hitSlop={8}
      onPress={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      style={({ pressed }) => ({
        width: 38,
        height: 38,
        borderRadius: radii.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.92)',
        opacity: pressed ? 0.85 : 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
      })}
    >
      <Icon name="heart" size={19} color={on ? colors.danger : colors.ink} fill={on} strokeWidth={2} />
    </Pressable>
  );
}
