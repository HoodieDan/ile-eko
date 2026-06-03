import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Body, Heading } from './Typography';

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps): React.ReactElement {
  const theme = useTheme();
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing['2xl'],
      }}
    >
      <Heading level={3} align="center">
        {title}
      </Heading>
      {description ? (
        <Body
          color={theme.colors.textMuted}
          align="center"
          style={{ marginTop: theme.spacing.sm }}
        >
          {description}
        </Body>
      ) : null}
      {action ? <View style={{ marginTop: theme.spacing.xl }}>{action}</View> : null}
    </View>
  );
}
