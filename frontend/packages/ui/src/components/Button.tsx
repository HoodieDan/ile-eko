import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Body } from './Typography';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  leadingIcon,
  trailingIcon,
  fullWidth,
  style,
  ...pressableProps
}: ButtonProps): React.ReactElement {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const palette = (() => {
    switch (variant) {
      case 'primary':
        return {
          bg: theme.colors.primary,
          bgPressed: theme.colors.primary,
          fg: theme.colors.primaryOn,
          border: 'transparent',
        };
      case 'secondary':
        return {
          bg: theme.colors.surface,
          bgPressed: theme.colors.surfaceMuted,
          fg: theme.colors.text,
          border: theme.colors.border,
        };
      case 'ghost':
        return {
          bg: 'transparent',
          bgPressed: theme.colors.surfaceMuted,
          fg: theme.colors.primary,
          border: 'transparent',
        };
      case 'destructive':
        return {
          bg: theme.colors.danger,
          bgPressed: theme.colors.danger,
          fg: '#FFFFFF',
          border: 'transparent',
        };
    }
  })();

  const sizing = (() => {
    switch (size) {
      case 'sm':
        return { paddingV: theme.spacing.sm, paddingH: theme.spacing.md, minH: 36 };
      case 'lg':
        return { paddingV: theme.spacing.lg, paddingH: theme.spacing.xl, minH: 56 };
      default:
        return { paddingV: theme.spacing.md, paddingH: theme.spacing.lg, minH: 48 };
    }
  })();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      {...pressableProps}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed && !isDisabled ? palette.bgPressed : palette.bg,
          borderColor: palette.border,
          borderRadius: theme.radii.md,
          minHeight: sizing.minH,
          paddingVertical: sizing.paddingV,
          paddingHorizontal: sizing.paddingH,
          opacity: isDisabled ? 0.55 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.row}>
          {leadingIcon ? <View style={{ marginRight: theme.spacing.sm }}>{leadingIcon}</View> : null}
          <Body strong color={palette.fg}>
            {label}
          </Body>
          {trailingIcon ? <View style={{ marginLeft: theme.spacing.sm }}>{trailingIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexDirection: 'row',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
