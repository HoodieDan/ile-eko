import React, { useRef, useState } from 'react';
import {
  Animated,
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
 *
 * The focus ring is driven by an Animated value (not React state) on purpose:
 * calling setState inside onFocus re-renders the TextInput's own subtree, which
 * on the iOS New Architecture immediately blurs the field (keyboard flickers and
 * drops). Animating avoids any re-render on focus, so the keyboard stays up.
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
  const [hidden, setHidden] = useState(secureTextEntry);
  const focusAnim = useRef(new Animated.Value(0)).current;
  const hasError = !!error;

  const borderColor = hasError
    ? colors.danger
    : focusAnim.interpolate({ inputRange: [0, 1], outputRange: [colors.line, colors.primary] });

  const animateFocus = (to: number): void => {
    Animated.timing(focusAnim, { toValue: to, duration: 140, useNativeDriver: false }).start();
  };

  return (
    <View style={containerStyle}>
      {label ? (
        <Text variant="captionStrong" color={colors.ink} style={{ fontSize: 13, marginBottom: 7 }}>
          {label}
        </Text>
      ) : null}
      <Animated.View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          minHeight: multiline ? 96 : 54,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor,
          backgroundColor: colors.surface,
          paddingHorizontal: 16,
        }}
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
          onFocus={() => animateFocus(1)}
          onBlur={() => animateFocus(0)}
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
      </Animated.View>
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
