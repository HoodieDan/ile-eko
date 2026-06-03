import { router } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSearchListings } from '@ile-eko/core';
import {
  AICard,
  Body,
  Card,
  Display,
  Heading,
  Overline,
  PropertyCard,
  SearchBar,
  useTheme,
} from '@ile-eko/ui';

function formatNGN(amount?: number): string | undefined {
  if (!amount) return undefined;
  return `₦${amount.toLocaleString('en-NG')}/yr`;
}

export default function Explore(): React.ReactElement {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const { data: listings = [] } = useSearchListings({ query });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <FlatList
        data={listings}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{
          padding: theme.spacing.xl,
          paddingBottom: theme.spacing['2xl'],
          gap: theme.spacing.lg,
        }}
        ListHeaderComponent={
          <View style={{ gap: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
            <View>
              <Overline color={theme.colors.textMuted}>Ilé Èkó Homes</Overline>
              <Display style={{ marginTop: theme.spacing.xs }}>Find your next home.</Display>
            </View>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder="Try “mini-flat in Yaba under ₦1m”"
            />
            <AICard
              eyebrow="Recommended for you"
              title="Quiet two-bedrooms near your workplace"
              body="Tell the assistant where you work and your budget, and it will surface homes you'd actually shortlist."
            />
            <Heading level={3}>Vacant near you</Heading>
          </View>
        }
        renderItem={({ item }) => (
          <PropertyCard
            title={item.propertyTitle}
            subtitle={item.address}
            area={item.area}
            priceLabel={formatNGN(item.rentAmount)}
            status="vacant"
            onPress={() => router.push(`/listing/${item.id}` as never)}
          />
        )}
        ListEmptyComponent={
          <Card>
            <Body color={theme.colors.textMuted}>
              No listings match your search yet. Try fewer words.
            </Body>
          </Card>
        }
      />
    </SafeAreaView>
  );
}
