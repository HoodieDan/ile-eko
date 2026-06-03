import React from 'react';
import { Pressable, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { elevation } from '../tokens/elevation';
import { Text } from './Text';
import { Icon } from './Icon';
import { StatusChip, type StatusKind } from './Chip';

export interface PropertyThumbProps {
  size?: number;
  radius?: number;
  height?: DimensionValue;
  width?: DimensionValue;
  tag?: string;
  glyphSize?: number;
  style?: StyleProp<ViewStyle>;
}

/** Deep-green property image placeholder with a building glyph. */
export function PropertyThumb({
  size,
  radius = 13,
  height,
  width,
  tag,
  glyphSize,
  style,
}: PropertyThumbProps): React.ReactElement {
  const h = height ?? size ?? 64;
  const w = width ?? size ?? 64;
  const numericMin = typeof w === 'number' && typeof h === 'number' ? Math.min(w, h) : 64;
  const glyph = glyphSize ?? numericMin * 0.42;
  return (
    <View
      style={[
        {
          width: w,
          height: h,
          borderRadius: radius,
          backgroundColor: colors.primaryDeep,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Icon name="building" size={glyph} color="rgba(255,255,255,0.18)" strokeWidth={1.6} />
      {tag ? (
        <View style={{ position: 'absolute', left: 10, bottom: 10 }}>
          <Text variant="label" color="rgba(255,255,255,0.7)" style={{ fontSize: 9.5, letterSpacing: 0.8 }}>
            {tag}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export interface PropertyCardProps {
  address: string;
  meta: string; // "Lekki Phase 1 · 3-bed flat"
  rent: string; // "₦2,500,000"
  rentSuffix?: string; // "/yr"
  status: StatusKind;
  days?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Image-top property card (grids / featured). */
export function PropertyCard({
  address,
  meta,
  rent,
  rentSuffix = '/yr',
  status,
  days,
  onPress,
  style,
}: PropertyCardProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { backgroundColor: colors.surface, borderRadius: 18, overflow: 'hidden', transform: [{ scale: pressed ? 0.985 : 1 }] },
        elevation.e1,
        style,
      ]}
    >
      <PropertyThumb height={120} width="100%" radius={0} glyphSize={44} />
      <View style={{ padding: 14 }}>
        <Text variant="title" style={{ fontSize: 16, lineHeight: 20 }} numberOfLines={1}>
          {address}
        </Text>
        <Text variant="caption" color={colors.muted} numberOfLines={1} style={{ marginTop: 2 }}>
          {meta}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 11 }}>
          <Text variant="bodyStrong">
            {rent}
            <Text variant="caption" color={colors.muted}>
              {' '}
              {rentSuffix}
            </Text>
          </Text>
          <StatusChip status={status} days={days} />
        </View>
      </View>
    </Pressable>
  );
}

export interface PropertyRowProps {
  address: string;
  meta: string;
  rent?: string;
  status: StatusKind;
  days?: number;
  tone?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Thumb-left list row for property lists. */
export function PropertyRow({
  address,
  meta,
  rent,
  status,
  days,
  onPress,
  style,
}: PropertyRowProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 13,
          backgroundColor: colors.surface,
          borderRadius: 18,
          padding: 11,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        elevation.e1,
        style,
      ]}
    >
      <PropertyThumb size={64} radius={13} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="title" style={{ fontSize: 15.5, lineHeight: 19 }} numberOfLines={1}>
          {address}
        </Text>
        <Text variant="caption" color={colors.muted} numberOfLines={1} style={{ marginTop: 2 }}>
          {meta}
        </Text>
        {rent ? (
          <Text variant="bodyStrong" style={{ fontSize: 14.5, marginTop: 4 }}>
            {rent}
          </Text>
        ) : null}
      </View>
      <StatusChip status={status} days={days} />
    </Pressable>
  );
}
