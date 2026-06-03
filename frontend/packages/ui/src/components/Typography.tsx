import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import type { TypographyVariant } from '../tokens/typography';

export interface TextBaseProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  numberOfLines?: number;
}

function TypographyBase({
  variant = 'body',
  color,
  align,
  style,
  children,
  ...rest
}: TextBaseProps): React.ReactElement {
  const theme = useTheme();
  const v = theme.typography[variant];
  const composed: TextStyle = {
    fontFamily: v.fontFamily,
    fontSize: v.fontSize,
    lineHeight: v.lineHeight,
    fontWeight: v.fontWeight,
    letterSpacing: v.letterSpacing,
    color: color ?? theme.colors.text,
    textAlign: align,
  };
  return (
    <Text {...rest} style={[composed, style]}>
      {children}
    </Text>
  );
}

export function Heading(props: Omit<TextBaseProps, 'variant'> & { level?: 1 | 2 | 3 }): React.ReactElement {
  const { level = 2, ...rest } = props;
  const variant: TypographyVariant = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';
  return <TypographyBase variant={variant} {...rest} />;
}

export function Display(props: Omit<TextBaseProps, 'variant'>): React.ReactElement {
  return <TypographyBase variant="display" {...props} />;
}

export function Body(props: Omit<TextBaseProps, 'variant'> & { strong?: boolean }): React.ReactElement {
  const { strong, ...rest } = props;
  return <TypographyBase variant={strong ? 'bodyStrong' : 'body'} {...rest} />;
}

export function Caption(props: Omit<TextBaseProps, 'variant'>): React.ReactElement {
  return <TypographyBase variant="caption" {...props} />;
}

export function Overline(props: Omit<TextBaseProps, 'variant'>): React.ReactElement {
  return <TypographyBase variant="overline" {...props} />;
}
