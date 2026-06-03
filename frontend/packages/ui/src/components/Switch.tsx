import React from 'react';
import { Switch as RNSwitch, View, type SwitchProps as RNSwitchProps } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Body } from './Typography';

export interface SwitchProps extends Omit<RNSwitchProps, 'value' | 'onValueChange'> {
  label?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}

export function Switch({ label, value, onValueChange, ...rest }: SwitchProps): React.ReactElement {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.sm,
      }}
    >
      {label ? <Body>{label}</Body> : <View />}
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={theme.colors.surface}
        {...rest}
      />
    </View>
  );
}
