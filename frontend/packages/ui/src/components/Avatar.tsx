import React from 'react';
import { Image, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Body } from './Typography';

export interface AvatarProps {
  name?: string;
  uri?: string;
  size?: number;
}

export function Avatar({ name, uri, size = 40 }: AvatarProps): React.ReactElement {
  const theme = useTheme();
  const initials = (name ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.colors.primaryMuted,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Body strong color={theme.colors.primary}>
        {initials}
      </Body>
    </View>
  );
}
