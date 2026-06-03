import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '../tokens/colors';
import { radii } from '../tokens/radii';
import { elevation } from '../tokens/elevation';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive' | 'ai';
export type ButtonSize = 'md' | 'sm';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

interface VariantStyle {
  bg: string;
  fg: string;
  border?: string;
}

function variantStyle(variant: ButtonVariant): VariantStyle {
  switch (variant) {
    case 'primary':
      return { bg: colors.accent, fg: colors.onAccent };
    case 'secondary':
      return { bg: 'transparent', fg: colors.primary, border: colors.primary };
    case 'ghost':
      return { bg: colors.surface2, fg: colors.ink };
    case 'outline':
      return { bg: 'transparent', fg: colors.ink, border: colors.line };
    case 'destructive':
      return { bg: colors.danger, fg: '#FFFFFF' };
    case 'ai':
      return { bg: colors.ai, fg: colors.onAi };
  }
}

/**
 * Primary = brass gold (ink text). Secondary = green outline. Plus ghost,
 * outline, destructive and the iris `ai` variant. ≥44px tap targets.
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}: ButtonProps): React.ReactElement {
  const v = variantStyle(variant);
  const isSm = size === 'sm';
  const isDisabled = disabled || loading;
  const iconSize = isSm ? 17 : 19;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          minHeight: isSm ? 44 : 52,
          borderRadius: isSm ? radii.md : radii.button,
          paddingHorizontal: isSm ? 16 : 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 9,
          backgroundColor: v.bg,
          borderWidth: v.border ? 1.6 : 0,
          borderColor: v.border,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          width: fullWidth ? '100%' : undefined,
          opacity: isDisabled ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.978 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={iconSize} color={v.fg} strokeWidth={2} fill={icon === 'spark'} /> : null}
          <Text variant="button" color={v.fg} style={isSm ? { fontSize: 14 } : undefined}>
            {title}
          </Text>
          {iconRight ? <Icon name={iconRight} size={iconSize} color={v.fg} strokeWidth={2} /> : null}
        </>
      )}
    </Pressable>
  );
}

export interface IconButtonProps {
  name: IconName;
  onPress?: () => void;
  /** `surface` = white with soft shadow (44px). `ghost` = surface-2 inset (42px). */
  variant?: 'surface' | 'ghost';
  size?: number;
  iconSize?: number;
  color?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  name,
  onPress,
  variant = 'surface',
  size,
  iconSize = 22,
  color = colors.ink,
  disabled = false,
  style,
}: IconButtonProps): React.ReactElement {
  const dim = size ?? (variant === 'surface' ? 44 : 42);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          width: dim,
          height: dim,
          borderRadius: variant === 'surface' ? 13 : 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: variant === 'surface' ? colors.surface : colors.surface2,
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.93 : 1 }],
        },
        variant === 'surface' ? elevation.e1 : null,
        style,
      ]}
    >
      <Icon name={name} size={iconSize} color={color} />
    </Pressable>
  );
}

export interface FABProps {
  label: string;
  icon?: IconName;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Floating add button — brass, bottom-right of a tabbed screen. */
export function FAB({ label, icon = 'plus', onPress, style }: FABProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 52,
          paddingLeft: 17,
          paddingRight: 20,
          borderRadius: 17,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: colors.accent,
          transform: [{ scale: pressed ? 0.96 : 1 }],
          shadowColor: colors.accent,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.5,
          shadowRadius: 16,
          elevation: 8,
        },
        style,
      ]}
    >
      <Icon name={icon} size={20} color={colors.onAccent} strokeWidth={2.4} />
      <Text variant="button" color={colors.onAccent}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Thin wrapper used by FAB-bearing screens to position it above the tab bar. */
export function FABHost({ children }: { children: React.ReactNode }): React.ReactElement {
  return <View style={{ position: 'absolute', right: 18, bottom: 18 }}>{children}</View>;
}
