import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Body, Caption } from './Typography';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  hint?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export function Input({
  label,
  hint,
  error,
  containerStyle,
  leadingIcon,
  trailingIcon,
  onFocus,
  onBlur,
  ...rest
}: InputProps): React.ReactElement {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error
    ? theme.colors.danger
    : focused
      ? theme.colors.primary
      : theme.colors.border;

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? (
        <Body strong style={{ marginBottom: theme.spacing.xs }}>
          {label}
        </Body>
      ) : null}
      <View
        style={[
          styles.field,
          {
            borderColor,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radii.md,
            paddingHorizontal: theme.spacing.md,
          },
        ]}
      >
        {leadingIcon ? <View style={{ marginRight: theme.spacing.sm }}>{leadingIcon}</View> : null}
        <TextInput
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholderTextColor={theme.colors.textSubtle}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              fontFamily: theme.typography.body.fontFamily,
              fontSize: theme.typography.body.fontSize,
            },
          ]}
        />
        {trailingIcon ? <View style={{ marginLeft: theme.spacing.sm }}>{trailingIcon}</View> : null}
      </View>
      {error ? (
        <Caption color={theme.colors.danger} style={{ marginTop: theme.spacing.xs }}>
          {error}
        </Caption>
      ) : hint ? (
        <Caption color={theme.colors.textMuted} style={{ marginTop: theme.spacing.xs }}>
          {hint}
        </Caption>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
  },
});
