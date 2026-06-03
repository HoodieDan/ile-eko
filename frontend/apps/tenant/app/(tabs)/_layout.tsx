import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, Text, colors, type IconName } from '@ile-eko/ui';

const TABS: Record<string, { label: string; icon: IconName }> = {
  explore: { label: 'Explore', icon: 'home' },
  search: { label: 'Search', icon: 'search' },
  saved: { label: 'Saved', icon: 'heart' },
  enquiries: { label: 'Enquiries', icon: 'message' },
  profile: { label: 'Profile', icon: 'user' },
};

/** Tenant bottom tab bar — forest-green active tabs (Saved heart fills when on). */
function HomesTabBar({ state, navigation }: BottomTabBarProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.line,
        paddingTop: 10,
        paddingBottom: insets.bottom + 8,
        paddingHorizontal: 10,
      }}
    >
      {state.routes.map((route, i) => {
        const cfg = TABS[route.name];
        if (!cfg) return null;
        const focused = state.index === i;
        const onPress = (): void => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <Pressable key={route.key} onPress={onPress} style={{ flex: 1, alignItems: 'center', gap: 4, paddingTop: 6 }}>
            <Icon
              name={cfg.icon}
              size={24}
              color={focused ? colors.primary : colors.muted}
              strokeWidth={focused ? 2.2 : 1.9}
              fill={cfg.icon === 'heart' && focused}
            />
            <Text variant="captionStrong" color={focused ? colors.primary : colors.muted} style={{ fontSize: 10.5 }}>
              {cfg.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout(): React.ReactElement {
  return (
    <Tabs tabBar={(props) => <HomesTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="search" options={{ title: 'Search' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
      <Tabs.Screen name="enquiries" options={{ title: 'Enquiries' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
