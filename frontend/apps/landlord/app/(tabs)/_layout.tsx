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
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="properties" options={{ title: 'Properties' }} />
      <Tabs.Screen name="ai" options={{ title: 'AI' }} />
      <Tabs.Screen name="team" options={{ title: 'Team' }} />
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
    </Tabs>
  );
}
