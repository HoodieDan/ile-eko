import React, { useState } from 'react';
import {
  Pressable,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors } from '../tokens/colors';
import { typography } from '../tokens/typography';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';

export interface InputProps {
  label?: string;
  value?: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  icon?: IconName;
  secureTextEntry?: boolean;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  multiline?: boolean;
  editable?: boolean;
  inputStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Text field with optional label, lead icon, password reveal and error state.
 * 54px min height, 4px focus ring (Design System §06).
 */
export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  secureTextEntry = false,
  error,
  keyboardType,
  autoCapitalize = 'sentences',
  autoCorrect,
  multiline = false,
  editable = true,
  inputStyle,
  containerStyle,
}: InputProps): React.ReactElement {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry);
  const hasError = !!error;
  const borderColor = hasError ? colors.danger : focused ? colors.primary : colors.line;

  return (
    <View style={containerStyle}>
      {label ? (
        <Text variant="captionStrong" color={colors.ink} style={{ fontSize: 13, marginBottom: 7 }}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: multiline ? 'flex-start' : 'center',
            minHeight: multiline ? 96 : 54,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor,
            backgroundColor: colors.surface,
            paddingHorizontal: 16,
          },
          focused && !hasError
            ? {
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.18,
                shadowRadius: 4,
                elevation: 0,
              }
            : null,
        ]}
      >
        {icon ? <Icon name={icon} size={19} color={colors.muted} /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(90,106,98,0.65)"
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            {
              flex: 1,
              color: colors.ink,
              fontFamily: typography.body.fontFamily,
              fontSize: 15.5,
              paddingVertical: multiline ? 14 : 0,
              marginLeft: icon ? 10 : 0,
              textAlignVertical: multiline ? 'top' : 'center',
            },
            inputStyle,
          ]}
        />
        {secureTextEntry ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8} style={{ paddingLeft: 8 }}>
            <Icon name={hidden ? 'eye' : 'eyeOff'} size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {hasError ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7 }}>
          <Icon name="alert" size={14} color={colors.danger} strokeWidth={2} />
          <Text variant="captionStrong" color={colors.danger}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export interface SearchBarProps {
  value?: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

/** Search field — leading magnifier, surface fill. */
export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search',
  containerStyle,
}: SearchBarProps): React.ReactElement {
  return (
    <Input
      icon="search"
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      autoCapitalize="none"
      autoCorrect={false}
      containerStyle={containerStyle}
    />
  );
}
