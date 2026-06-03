import React from 'react';
import { StyleSheet, TextInput, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Body } from './Typography';

export interface SearchBarProps {
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  containerStyle?: ViewStyle;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search',
  onSubmit,
  containerStyle,
}: SearchBarProps): React.ReactElement {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius: theme.radii.pill,
          paddingHorizontal: theme.spacing.lg,
        },
        containerStyle,
      ]}
    >
      <Body color={theme.colors.textSubtle} style={{ marginRight: theme.spacing.sm }}>
        {'⌕'}
      </Body>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        placeholder={placeholder}
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
  },
});
