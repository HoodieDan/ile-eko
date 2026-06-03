import React from 'react';
import { View } from 'react-native';
import { colors } from '../tokens/colors';
import { Icon, type IconName } from './Icon';

export function Timeline({ children }: { children: React.ReactNode }): React.ReactElement {
  return <View>{children}</View>;
}

export interface TimelineItemProps {
  icon?: IconName;
  iconColor?: string;
  last?: boolean;
  children: React.ReactNode;
}

/** One node on a vertical timeline — dot/icon in the rail, content to the right. */
export function TimelineItem({ icon, iconColor = colors.muted, last = false, children }: TimelineItemProps): React.ReactElement {
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ width: 18, alignItems: 'center' }}>
        {!last ? (
          <View style={{ position: 'absolute', top: 4, bottom: 0, width: 2, backgroundColor: colors.line }} />
        ) : null}
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: colors.surface,
            borderWidth: 3,
            borderColor: colors.bg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon ? <Icon name={icon} size={11} color={iconColor} strokeWidth={2.2} fill={icon === 'spark'} /> : null}
        </View>
      </View>
      <View style={{ flex: 1, paddingBottom: last ? 0 : 18 }}>{children}</View>
    </View>
  );
}
