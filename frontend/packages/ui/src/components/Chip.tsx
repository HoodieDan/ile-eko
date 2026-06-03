import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';

export type ChipTone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral' | 'ai';

// Read at render so the active theme (Verdant / Adire) is picked up.
function toneStyle(tone: ChipTone): { bg: string; fg: string } {
  switch (tone) {
    case 'ok':
      return { bg: colors.okTint, fg: colors.ok };
    case 'warn':
      return { bg: colors.warnTint, fg: colors.warn };
    case 'danger':
      return { bg: colors.dangerTint, fg: colors.danger };
    case 'info':
      return { bg: colors.infoTint, fg: colors.info };
    case 'neutral':
      return { bg: colors.neutralTint, fg: colors.neutral };
    case 'ai':
      return { bg: colors.aiTint, fg: colors.aiDeep };
  }
}

export interface ChipProps {
  label: string;
  tone?: ChipTone;
  icon?: IconName;
  /** Solid fill (used by the AI pill). */
  solid?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, tone = 'neutral', icon, solid = false, style }: ChipProps): React.ReactElement {
  const t = toneStyle(tone);
  const bg = solid ? t.fg : t.bg;
  const fg = solid ? '#FFFFFF' : t.fg;
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          borderRadius: 999,
          paddingVertical: 6,
          paddingHorizontal: 11,
          backgroundColor: bg,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={13} color={fg} strokeWidth={2.2} fill={icon === 'spark'} /> : null}
      <Text variant="captionStrong" color={fg} style={{ lineHeight: 13 }}>
        {label}
      </Text>
    </View>
  );
}

export type StatusKind =
  | 'paid'
  | 'confirmed'
  | 'occupied'
  | 'due'
  | 'pending'
  | 'partial'
  | 'mixed'
  | 'overdue'
  | 'vacant';

const STATUS_MAP: Record<StatusKind, { tone: ChipTone; icon: IconName; label: (days?: number) => string }> = {
  paid: { tone: 'ok', icon: 'check', label: () => 'Paid' },
  confirmed: { tone: 'ok', icon: 'checkCircle', label: () => 'Confirmed' },
  occupied: { tone: 'ok', icon: 'check', label: () => 'Occupied' },
  due: { tone: 'warn', icon: 'clock', label: (d) => (d != null ? `Due in ${d}d` : 'Due soon') },
  pending: { tone: 'warn', icon: 'clock', label: () => 'Pending' },
  partial: { tone: 'info', icon: 'half', label: () => 'Partial' },
  mixed: { tone: 'info', icon: 'layers', label: () => 'Mixed' },
  overdue: { tone: 'danger', icon: 'alert', label: (d) => (d != null ? `${d}d overdue` : 'Overdue') },
  vacant: { tone: 'neutral', icon: 'door', label: () => 'Vacant' },
};

export interface StatusChipProps {
  status: StatusKind;
  days?: number;
  style?: StyleProp<ViewStyle>;
}

/** Status pill — colour + icon + label, never colour alone (Design System §07). */
export function StatusChip({ status, days, style }: StatusChipProps): React.ReactElement {
  const s = STATUS_MAP[status] ?? STATUS_MAP.vacant;
  return <Chip tone={s.tone} icon={s.icon} label={s.label(days)} style={style} />;
}
