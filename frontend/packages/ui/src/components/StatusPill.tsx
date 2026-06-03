import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Overline } from './Typography';

export type StatusPillState =
  | 'vacant'
  | 'occupied'
  | 'overdue'
  | 'pending'
  | 'confirmed'
  | 'partial';

export interface StatusPillProps {
  state: StatusPillState;
  label?: string;
}

const STATE_LABEL: Record<StatusPillState, string> = {
  vacant: 'Vacant',
  occupied: 'Occupied',
  overdue: 'Overdue',
  pending: 'Pending',
  confirmed: 'Confirmed',
  partial: 'Partial',
};

export function StatusPill({ state, label }: StatusPillProps): React.ReactElement {
  const theme = useTheme();
  const bg = (() => {
    switch (state) {
      case 'vacant':
        return theme.colors.successMuted;
      case 'occupied':
        return theme.colors.primaryMuted;
      case 'overdue':
        return theme.colors.dangerMuted;
      case 'pending':
        return theme.colors.warningMuted;
      case 'confirmed':
        return theme.colors.successMuted;
      case 'partial':
        return theme.colors.warningMuted;
    }
  })();
  const fg = (() => {
    switch (state) {
      case 'vacant':
        return theme.colors.pillVacant;
      case 'occupied':
        return theme.colors.pillOccupied;
      case 'overdue':
        return theme.colors.pillOverdue;
      case 'pending':
        return theme.colors.pillPending;
      case 'confirmed':
        return theme.colors.pillConfirmed;
      case 'partial':
        return theme.colors.pillPartial;
    }
  })();
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: bg,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radii.pill,
      }}
    >
      <Overline color={fg}>{label ?? STATE_LABEL[state]}</Overline>
    </View>
  );
}
