import { Tabs } from 'expo-router';
import React from 'react';
import { buildTabBarStyle, useTheme } from '@ile-eko/ui';

export default function TabLayout(): React.ReactElement {
  const theme = useTheme();
  const tab = buildTabBarStyle(theme);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tab.activeTintColor,
        tabBarInactiveTintColor: tab.inactiveTintColor,
        tabBarStyle: {
          backgroundColor: tab.backgroundColor,
          borderTopColor: tab.borderTopColor,
        },
        tabBarLabelStyle: tab.labelStyle,
      }}
    >
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="search" options={{ title: 'Search' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
      <Tabs.Screen name="enquiries" options={{ title: 'Enquiries' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
