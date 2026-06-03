import React from 'react';
import { Image, Pressable, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Card } from './Card';
import { StatusPill, type StatusPillState } from './StatusPill';
import { Body, Caption, Heading } from './Typography';

export interface PropertyCardProps {
  title: string;
  subtitle?: string;
  area?: string;
  priceLabel?: string;
  imageUri?: string;
  status?: StatusPillState;
  onPress?: () => void;
}

export function PropertyCard({
  title,
  subtitle,
  area,
  priceLabel,
  imageUri,
  status,
  onPress,
}: PropertyCardProps): React.ReactElement {
  const theme = useTheme();
  const Inner = (
    <Card padding="none">
      <View
        style={{
          height: 160,
          backgroundColor: theme.colors.surfaceMuted,
          borderTopLeftRadius: theme.radii.lg,
          borderTopRightRadius: theme.radii.lg,
          overflow: 'hidden',
          justifyContent: 'flex-end',
          padding: theme.spacing.md,
        }}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            resizeMode="cover"
          />
        ) : null}
        {status ? <StatusPill state={status} /> : null}
      </View>
      <View style={{ padding: theme.spacing.lg }}>
        <Heading level={3}>{title}</Heading>
        {subtitle ? (
          <Body color={theme.colors.textMuted} style={{ marginTop: theme.spacing.xs }}>
            {subtitle}
          </Body>
        ) : null}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: theme.spacing.md,
          }}
        >
          {area ? <Caption color={theme.colors.textMuted}>{area}</Caption> : <View />}
          {priceLabel ? <Body strong>{priceLabel}</Body> : null}
        </View>
      </View>
    </Card>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
        {Inner}
      </Pressable>
    );
  }
  return Inner;
}
