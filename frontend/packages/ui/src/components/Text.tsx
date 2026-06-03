import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type StyleProp, type TextStyle } from 'react-native';
import { typography, type TypographyVariant } from '../tokens/typography';
import { colors } from '../tokens/colors';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  center?: boolean;
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

/**
 * Themed text. Pick a `variant` from the type scale; everything inherits the
 * right family/size/line-height/tracking. Default colour is ink.
 */
export function Text({
  variant = 'body',
  color = colors.ink,
  center = false,
  style,
  children,
  ...rest
}: TextProps): React.ReactElement {
  return (
    <RNText
      {...rest}
      style={[typography[variant], { color }, center && { textAlign: 'center' }, style]}
    >
      {children}
    </RNText>
  );
}

/** Mono uppercase eyebrow label (muted by default). */
export function Eyebrow({
  color = colors.muted,
  style,
  children,
  ...rest
}: Omit<TextProps, 'variant'>): React.ReactElement {
  return (
    <Text variant="label" color={color} style={style} {...rest}>
      {children}
    </Text>
  );
}
