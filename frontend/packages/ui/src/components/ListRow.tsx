import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { elevation } from '../tokens/elevation';
import { Text } from './Text';
import { Icon } from './Icon';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  /** Show a trailing chevron (overrides `right`). */
  chevron?: boolean;
  onPress?: () => void;
  flat?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Generic list row — optional left slot, title/subtitle, right slot or chevron. */
export function ListRow({
  title,
  subtitle,
  left,
  right,
  chevron = false,
  onPress,
  flat = false,
  style,
}: ListRowProps): React.ReactElement {
  const body = (
    <>
      {left ? <View>{left}</View> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color={colors.muted} numberOfLines={1} style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {chevron ? <Icon name="fwd" size={18} color={colors.muted} /> : right}
    </>
  );

  const base: StyleProp<ViewStyle> = [
    {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 12,
    },
    flat ? { borderWidth: 1, borderColor: colors.line } : elevation.e1,
    style,
  ];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [base, { transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
        {body}
      </Pressable>
    );
  }
  return <View style={base}>{body}</View>;
}
