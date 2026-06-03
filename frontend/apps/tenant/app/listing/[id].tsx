import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useProperty } from '@ile-eko/core';
import {
  Body,
  Button,
  Caption,
  Card,
  Display,
  Heading,
  StatusPill,
  useTheme,
} from '@ile-eko/ui';

export default function ListingDetail(): React.ReactElement {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: property, isLoading } = useProperty(id);
  const { status } = useAuth();

  function onEnquire() {
    if (status !== 'authenticated') {
      router.push({
        pathname: '/(auth)/login',
        params: { redirect: `/enquire/${id}` },
      } as never);
      return;
    }
    router.push(`/enquire/${id}` as never);
  }

  if (isLoading || !property) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ padding: theme.spacing.xl }}>
          <Body color={theme.colors.textMuted}>Loading…</Body>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing['2xl'] }}>
        <View
          style={{
            height: 260,
            backgroundColor: theme.colors.surfaceMuted,
            justifyContent: 'flex-end',
            padding: theme.spacing.xl,
          }}
        >
          <StatusPill state="vacant" />
        </View>
        <View style={{ padding: theme.spacing.xl, gap: theme.spacing.md }}>
          <Display>{property.propertyTitle}</Display>
          <Caption color={theme.colors.textMuted}>{property.address}</Caption>
          {property.rentAmount ? (
            <Heading level={2}>₦{property.rentAmount.toLocaleString('en-NG')}/yr</Heading>
          ) : null}
          <Card>
            <Body strong style={{ marginBottom: theme.spacing.sm }}>
              About this home
            </Body>
            <Body color={theme.colors.textMuted}>{property.description}</Body>
          </Card>
          <Card>
            <Body strong style={{ marginBottom: theme.spacing.sm }}>
              Details
            </Body>
            <Body color={theme.colors.textMuted}>
              {property.propertyType.replace('-', ' ')} · {property.area} · {property.lga}
            </Body>
          </Card>
          <Button label="Enquire" fullWidth onPress={onEnquire} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
