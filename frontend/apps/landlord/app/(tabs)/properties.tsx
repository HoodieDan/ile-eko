import { router } from 'expo-router';
import React from 'react';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProperties } from '@ile-eko/core';
import { Button, Heading, PropertyCard, useTheme } from '@ile-eko/ui';

// TODO: build to match Claude Design — Properties tab
export default function PropertiesTab(): React.ReactElement {
  const theme = useTheme();
  const { data: properties = [] } = useProperties();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View
        style={{
          padding: theme.spacing.xl,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Heading level={1}>Properties</Heading>
        <Button label="Add" size="sm" onPress={() => router.push('/properties/add')} />
      </View>
      <FlatList
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.xl,
          paddingBottom: theme.spacing.xl,
          gap: theme.spacing.lg,
        }}
        data={properties}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <PropertyCard
            title={item.propertyTitle}
            subtitle={item.address}
            area={item.area}
            status={item.status === 'occupied' ? 'occupied' : item.status === 'vacant' ? 'vacant' : 'partial'}
            onPress={() => router.push(`/properties/${item.id}` as never)}
          />
        )}
      />
    </SafeAreaView>
  );
}
