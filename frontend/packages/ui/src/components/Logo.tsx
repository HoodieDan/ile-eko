import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { Text } from './Text';

export interface LogoMarkProps {
  size?: number;
  onDark?: boolean;
  /** Colour of the "doorway" negative space; defaults to the paper background. */
  notch?: string;
  style?: ViewStyle;
}

/**
 * The Ilé Èkó mark: a forest-green rounded square with a doorway notch cut from
 * the bottom and a brass dot top-right — a stylised house. Reproduced from the
 * design's CSS `.mk` element.
 */
export function LogoMark({ size = 38, onDark = false, notch, style }: LogoMarkProps): React.ReactElement {
  const radius = size * 0.29;
  const notchW = size * 0.42;
  const notchH = size * 0.58;
  const dot = size * 0.18;
  const notchColor = notch ?? (onDark ? colors.primaryDeep : colors.bg);
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: radius, backgroundColor: colors.primary, overflow: 'hidden' },
        style,
      ]}
    >
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: (size - notchW) / 2,
          width: notchW,
          height: notchH,
          backgroundColor: notchColor,
          borderTopLeftRadius: notchW / 2,
          borderTopRightRadius: notchW / 2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: size * 0.18,
          right: size * 0.18,
          width: dot,
          height: dot,
          borderRadius: dot / 2,
          backgroundColor: colors.accent,
        }}
      />
    </View>
  );
}

export interface LogoProps {
  size?: number;
  showText?: boolean;
  onDark?: boolean;
  notch?: string;
}

/** Full lockup: mark + "Ilé Èkó" wordmark. */
export function Logo({ size = 38, showText = true, onDark = false, notch }: LogoProps): React.ReactElement {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
      <LogoMark size={size} onDark={onDark} notch={notch} />
      {showText ? (
        <Text variant="h2" color={onDark ? '#FFFFFF' : colors.ink} style={{ fontSize: size * 0.56 }}>
          Ilé Èkó
        </Text>
      ) : null}
    </View>
  );
}
