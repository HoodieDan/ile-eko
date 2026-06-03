import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Card } from './Card';
import { Caption, Heading, Overline } from './Typography';

export interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  trend?: 'up' | 'down' | 'flat';
}

export function StatCard({ label, value, hint, trend }: StatCardProps): React.ReactElement {
  const theme = useTheme();
  const trendColor =
    trend === 'up' ? theme.colors.success : trend === 'down' ? theme.colors.danger : theme.colors.textMuted;
  return (
    <Card>
      <Overline color={theme.colors.textMuted}>{label}</Overline>
      <View style={{ marginTop: theme.spacing.sm }}>
        <Heading level={2}>{value}</Heading>
      </View>
      {hint ? (
        <Caption color={trendColor} style={{ marginTop: theme.spacing.xs }}>
          {hint}
        </Caption>
      ) : null}
    </Card>
  );
}
