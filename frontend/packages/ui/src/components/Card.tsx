import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, withAlpha } from '../tokens/colors';
import { radii } from '../tokens/radii';
import { elevation } from '../tokens/elevation';
import { Text } from './Text';
import { Icon } from './Icon';

export interface CardProps {
  children?: React.ReactNode;
  /** Flat = hairline border, no shadow. */
  flat?: boolean;
  padding?: number;
  radius?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Standard surface card — radius 20, soft e1 shadow. */
export function Card({
  children,
  flat = false,
  padding = 18,
  radius = radii.card,
  onPress,
  style,
}: CardProps): React.ReactElement {
  const base: StyleProp<ViewStyle> = [
    {
      backgroundColor: colors.surface,
      borderRadius: radius,
      padding,
    },
    flat ? { borderWidth: 1, borderColor: colors.line } : elevation.e1,
    style,
  ];
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [base, { transform: [{ scale: pressed ? 0.985 : 1 }] }]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={base}>{children}</View>;
}

/** Iris "AI insight" label: filled sparkle + uppercase tracking. */
export function AILabel({ children = 'AI', color = colors.aiDeep }: { children?: React.ReactNode; color?: string }): React.ReactElement {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Icon name="spark" size={13} color={color} fill />
      <Text variant="label" color={color}>
        {children}
      </Text>
    </View>
  );
}

export interface AICardProps {
  children?: React.ReactNode;
  padding?: number;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

/** AI surface — iris tint fill with a hairline iris ring. AI only. */
export function AICard({ children, padding = 16, style, onPress }: AICardProps): React.ReactElement {
  const base: StyleProp<ViewStyle> = [
    {
      backgroundColor: colors.aiTint,
      borderRadius: radii.card,
      padding,
      borderWidth: 1,
      borderColor: withAlpha(colors.ai, 0.28),
    },
    style,
  ];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [base, { transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={base}>{children}</View>;
}
