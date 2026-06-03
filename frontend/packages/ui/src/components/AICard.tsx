import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Body, Heading, Overline } from './Typography';

export interface AIBadgeProps {
  label?: string;
}

export function AIBadge({ label = 'AI' }: AIBadgeProps): React.ReactElement {
  const theme = useTheme();
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.aiAccentMuted,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.radii.pill,
      }}
    >
      <Overline color={theme.colors.aiAccent}>{label}</Overline>
    </View>
  );
}

export interface AICardProps {
  eyebrow?: string;
  title: string;
  body?: string;
  footer?: React.ReactNode;
}

export function AICard({ eyebrow, title, body, footer }: AICardProps): React.ReactElement {
  const theme = useTheme();
  return (
    <View
      style={{
        borderRadius: theme.radii.lg,
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.aiAccentMuted,
        borderWidth: 1,
        borderColor: theme.colors.aiAccent,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AIBadge label={eyebrow ?? 'AI'} />
      </View>
      <View style={{ marginTop: theme.spacing.sm }}>
        <Heading level={3} color={theme.colors.aiAccent}>
          {title}
        </Heading>
      </View>
      {body ? (
        <Body color={theme.colors.text} style={{ marginTop: theme.spacing.sm }}>
          {body}
        </Body>
      ) : null}
      {footer ? <View style={{ marginTop: theme.spacing.md }}>{footer}</View> : null}
    </View>
  );
}
