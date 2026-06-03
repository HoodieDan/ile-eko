import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Body } from './Typography';

export interface CheckboxProps {
  label?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

export function Checkbox({ label, checked, onChange, disabled }: CheckboxProps): React.ReactElement {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => !disabled && onChange(!checked)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.xs,
        opacity: disabled ? 0.5 : 1,
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: !!disabled }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: theme.radii.sm,
          borderWidth: 2,
          borderColor: checked ? theme.colors.primary : theme.colors.borderStrong,
          backgroundColor: checked ? theme.colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked ? <Body color={theme.colors.primaryOn} strong>{'✓'}</Body> : null}
      </View>
      {label ? <Body style={{ marginLeft: theme.spacing.sm }}>{label}</Body> : null}
    </Pressable>
  );
}
