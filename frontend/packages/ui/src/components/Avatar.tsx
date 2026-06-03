import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { Text } from './Text';

export type AvatarTone = 'tint' | 'accent' | 'danger' | 'solid';

// Read at render so the active theme (Verdant / Adire) is picked up.
function toneStyle(tone: AvatarTone): { bg: string; fg: string } {
  switch (tone) {
    case 'tint':
      return { bg: colors.primaryTint, fg: colors.primary };
    case 'accent':
      return { bg: colors.accentTint, fg: colors.ink };
    case 'danger':
      return { bg: colors.dangerTint, fg: colors.danger };
    case 'solid':
      return { bg: colors.primary, fg: colors.onPrimary };
  }
}

export interface AvatarProps {
  initials: string;
  size?: number;
  tone?: AvatarTone;
  style?: StyleProp<ViewStyle>;
}

/** Circular initials avatar. */
export function Avatar({ initials, size = 44, tone = 'tint', style }: AvatarProps): React.ReactElement {
  const t = toneStyle(tone);
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: t.bg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text variant="bodyStrong" color={t.fg} style={{ fontSize: size * 0.34, lineHeight: size * 0.34 }}>
        {initials}
      </Text>
    </View>
  );
}
