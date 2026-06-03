import React from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export interface CardProps extends ViewProps {
  padding?: 'sm' | 'md' | 'lg' | 'none';
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export function Card({
  padding = 'md',
  elevation = 'sm',
  style,
  children,
  ...rest
}: CardProps): React.ReactElement {
  const theme = useTheme();
  const pad =
    padding === 'none'
      ? 0
      : padding === 'sm'
        ? theme.spacing.md
        : padding === 'lg'
          ? theme.spacing.xl
          : theme.spacing.lg;
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.lg,
          padding: pad,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        theme.elevation[elevation],
        style,
      ]}
    >
      {children}
    </View>
  );
}
