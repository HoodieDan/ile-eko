import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProperty } from '@ile-eko/core';
import { Body, Heading, useTheme } from '@ile-eko/ui';

// TODO: build to match Claude Design — Property detail
export default function PropertyDetail(): React.ReactElement {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: property } = useProperty(id);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.md }}>
        <Heading level={1}>{property?.propertyTitle ?? 'Property'}</Heading>
        <Body color={theme.colors.textMuted}>{property?.address}</Body>
      </View>
    </SafeAreaView>
  );
}
