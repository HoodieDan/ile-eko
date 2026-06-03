import React from 'react';
import { Pressable, View } from 'react-native';
import { colors } from '../tokens/colors';
import { Text } from './Text';
import { Icon } from './Icon';

export interface CheckboxProps {
  checked: boolean;
  onChange?: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}

/** 24×24 checkbox — checked = forest fill + white tick, empty = line border. */
export function Checkbox({ checked, onChange, label, disabled = false }: CheckboxProps): React.ReactElement {
  return (
    <Pressable
      onPress={() => onChange?.(!checked)}
      disabled={disabled}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 9, opacity: disabled ? 0.5 : 1 }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 7,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: checked ? colors.primary : 'transparent',
          borderWidth: checked ? 0 : 1.6,
          borderColor: colors.line,
        }}
      >
        {checked ? <Icon name="check" size={15} color="#FFFFFF" strokeWidth={2.6} /> : null}
      </View>
      {label ? (
        <Text variant="bodyMedium" color={checked ? colors.ink : colors.muted}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}
