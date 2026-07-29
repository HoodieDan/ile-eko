import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  Icon,
  IconButton,
  Text,
  colors,
  heroGradient,
  radii,
  spacing,
  useToast,
  type IconName,
} from '@ile-eko/ui';
import {
  naira,
  initialsOf,
  useAuth,
  useListing,
  useRecordView,
  useSaveListing,
  useUnsaveListing,
} from '@ile-eko/core';

/** Amenity key → icon + label, mirroring the design's amenity vocabulary. */
const AMENITIES: Record<string, { ic: IconName; label: string }> = {
  water: { ic: 'droplet', label: 'Borehole / water' },
  power: { ic: 'bolt', label: '24/7 power' },
  security: { ic: 'shield', label: 'Security' },
  parking: { ic: 'car', label: 'Parking' },
  furnished: { ic: 'sofa', label: 'Furnished' },
  kitchen: { ic: 'home', label: 'Fitted kitchen' },
  wifi: { ic: 'wifi', label: 'Wi-Fi ready' },
};

function amenityMeta(key: string): { ic: IconName; label: string } {
  return AMENITIES[key] ?? { ic: 'checkCircle', label: key };
}

interface FactProps {
  icon: IconName;
  label: string;
  value: string;
  border?: boolean;
}

function Fact({ icon, label, value, border = false }: FactProps): React.ReactElement {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        borderLeftWidth: border ? 1 : 0,
        borderRightWidth: border ? 1 : 0,
        borderColor: colors.line,
      }}
    >
      <Icon name={icon} size={19} color={colors.primary} />
      <Text variant="title" style={{ fontSize: 17, marginTop: 4 }}>
        {value}
      </Text>
      <Text variant="caption" color={colors.muted} style={{ marginTop: 1 }}>
        {label}
      </Text>
    </View>
  );
}

export default function ListingDetail(): React.ReactElement | null {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: l, isLoading, isError, refetch } = useListing(id);
  const recordView = useRecordView();
  const saveListing = useSaveListing();
  const unsaveListing = useUnsaveListing();

  // Record a marketplace view once per listing open (fire-and-forget).
  useEffect(() => {
    if (id) recordView.mutate({ id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // Error or not-found: never a blank screen — the back control stays reachable.
  if (isError || !l) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <StatusBar style="dark" />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
          }}
        >
          <IconButton name="back" variant="surface" onPress={() => router.back()} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl }}>
          <EmptyState
            icon="alert"
            title="Couldn't load this home"
            message="Check your connection and try again."
          />
          <Button title="Try again" variant="secondary" onPress={() => void refetch()} />
        </View>
      </View>
    );
  }

  const saved = l.saved ?? false;
  const initials = initialsOf(l.landlordName);

  const toggleSave = (): void => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    if (saved) {
      unsaveListing.mutate(l.id);
      showToast('Removed from shortlist', 'heart');
    } else {
      saveListing.mutate(l.id);
      showToast('Saved to your shortlist', 'heart');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* Hero (bleeds up behind the status bar) */}
        <View style={{ height: 280 + insets.top }}>
          <LinearGradient
            colors={heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: insets.top,
            }}
          >
            <Icon name="building" size={120} color="rgba(255,255,255,0.16)" strokeWidth={1.4} />
            <View
              style={{
                position: 'absolute',
                top: spacing.md + insets.top,
                left: spacing.xl,
                right: spacing.xl,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <IconButton name="back" variant="surface" onPress={() => router.back()} />
              <IconButton
                name="heart"
                variant="surface"
                onPress={toggleSave}
                color={saved ? colors.danger : colors.ink}
              />
            </View>
            {l.verified ? (
              <View style={{ position: 'absolute', left: spacing.xl, bottom: spacing['2xl'] }}>
                <Chip label="Verified listing" tone="ok" icon="checkCircle" />
              </View>
            ) : null}
          </LinearGradient>
        </View>

        {/* Body */}
        <View
          style={{
            backgroundColor: colors.bg,
            borderTopLeftRadius: radii.xl,
            borderTopRightRadius: radii.xl,
            marginTop: -18,
            paddingTop: spacing.xl,
            paddingHorizontal: spacing.xl,
          }}
        >
          <Text variant="h2" style={{ fontSize: 24, lineHeight: 27 }}>
            {l.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 }}>
            <Icon name="pin" size={14} color={colors.muted} />
            <Text variant="caption" color={colors.muted} style={{ fontSize: 14.5 }}>
              {l.area} · {l.lga}, Lagos
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
            <Text variant="h1" style={{ fontSize: 28 }}>
              {naira(l.rent)}
            </Text>
            <Text variant="caption" color={colors.muted} style={{ fontSize: 14 }}>
              / year
            </Text>
          </View>

          {/* Facts */}
          <Card padding={14} style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row' }}>
              <Fact icon="bed" label="Bedrooms" value={String(l.beds)} />
              <Fact icon="bath" label="Bathrooms" value={String(l.baths)} border />
              <Fact icon="ruler" label="Size" value={`${l.size} m²`} />
            </View>
          </Card>

          {/* Amenities */}
          {l.amenities.length > 0 ? (
            <>
              <Text variant="title" style={{ marginTop: spacing['2xl'], marginBottom: spacing.md }}>
                Amenities
              </Text>
              <Card padding={16}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {l.amenities.map((a) => {
                    const am = amenityMeta(a);
                    return (
                      <View
                        key={a}
                        style={{
                          width: '50%',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 10,
                          paddingVertical: 7,
                        }}
                      >
                        <View
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            backgroundColor: colors.primaryTint,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon name={am.ic} size={17} color={colors.primary} />
                        </View>
                        <Text
                          variant="bodyMedium"
                          style={{ fontSize: 13.5, flex: 1 }}
                          numberOfLines={2}
                        >
                          {am.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </Card>
            </>
          ) : null}

          {/* Description */}
          <Text variant="title" style={{ marginTop: spacing['2xl'], marginBottom: spacing.sm }}>
            About this home
          </Text>
          <Text variant="body" color={colors.muted} style={{ fontSize: 14.5, lineHeight: 23 }}>
            {l.description}
          </Text>

          {/* Location */}
          <Text variant="title" style={{ marginTop: spacing['2xl'], marginBottom: spacing.md }}>
            Location
          </Text>
          <View
            style={{
              height: 150,
              borderRadius: 18,
              overflow: 'hidden',
              backgroundColor: colors.surface2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="pin" size={22} color="#FFFFFF" />
            </View>
            <Text variant="label" color={colors.muted} style={{ marginTop: spacing.sm }}>
              {l.area} · MAP PREVIEW
            </Text>
          </View>

          {/* Landlord (no owner-only data) */}
          <Card flat style={{ marginTop: 18, paddingVertical: 14, paddingHorizontal: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 11,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Avatar initials={initials} size={40} tone="tint" />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="label" color={colors.muted}>
                    LISTED BY
                  </Text>
                  <Text
                    variant="bodyStrong"
                    style={{ fontSize: 14.5, marginTop: 2 }}
                    numberOfLines={1}
                  >
                    {l.landlordName}
                  </Text>
                </View>
              </View>
              <Chip label="Verified" tone="ok" icon="checkCircle" />
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Sticky bottom bar */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          flexDirection: 'row',
          gap: spacing.md,
          paddingHorizontal: spacing.xl,
          paddingTop: 14,
          paddingBottom: 28,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.line,
        }}
      >
        <IconButton
          name="heart"
          variant="ghost"
          size={56}
          iconSize={20}
          onPress={toggleSave}
          color={saved ? colors.danger : colors.ink}
          style={{ borderWidth: 1.6, borderColor: colors.primary, backgroundColor: colors.surface }}
        />
        <Button
          title="Enquire / Contact landlord"
          variant="primary"
          icon="message"
          fullWidth={false}
          onPress={() => router.push(`/enquire/${l.id}`)}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
