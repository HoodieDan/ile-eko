import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: IconName;
  title: string;
  message?: string;
  action?: { label: string; onPress?: () => void };
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({ icon, title, message, action, style }: EmptyStateProps): React.ReactElement {
  return (
    <View style={[{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 }, style]}>
      <View
        style={{
          width: 66,
          height: 66,
          borderRadius: 20,
          backgroundColor: colors.surface2,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Icon name={icon} size={30} color={colors.muted} />
      </View>
      <Text variant="h3" center>
        {title}
      </Text>
      {message ? (
        <Text variant="caption" color={colors.muted} center style={{ marginTop: 5 }}>
          {message}
        </Text>
      ) : null}
      {action ? (
        <Button title={action.label} onPress={action.onPress} size="sm" fullWidth={false} style={{ marginTop: 16 }} />
      ) : null}
    </View>
  );
}
