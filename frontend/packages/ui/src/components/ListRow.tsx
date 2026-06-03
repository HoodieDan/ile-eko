import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Body, Caption } from './Typography';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
}

export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
}: ListRowProps): React.ReactElement {
  const theme = useTheme();
  const Inner = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
      }}
    >
      {leading ? <View style={{ marginRight: theme.spacing.md }}>{leading}</View> : null}
      <View style={{ flex: 1 }}>
        <Body strong>{title}</Body>
        {subtitle ? <Caption color={theme.colors.textMuted}>{subtitle}</Caption> : null}
      </View>
      {trailing ? <View style={{ marginLeft: theme.spacing.md }}>{trailing}</View> : null}
    </View>
  );
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        android_ripple={{ color: theme.colors.surfaceMuted }}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        {Inner}
      </Pressable>
    );
  }
  return Inner;
}
