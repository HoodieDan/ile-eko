import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, Text, colors, type IconName } from '@ile-eko/ui';

const TABS: Record<string, { label: string; icon: IconName; center?: boolean }> = {
  index: { label: 'Home', icon: 'home' },
  properties: { label: 'Properties', icon: 'building' },
  ai: { label: 'AI', icon: 'spark', center: true },
  team: { label: 'Team', icon: 'users' },
  account: { label: 'Account', icon: 'user' },
};

/** Custom bottom tab bar — forest-green tabs with the iris AI bubble centred. */
function VerdantTabBar({ state, navigation }: BottomTabBarProps): React.ReactElement {
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

        if (cfg.center) {
          return (
            <Pressable key={route.key} onPress={onPress} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <View
                style={{
                  width: 48,
                  height: 34,
                  borderRadius: 13,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: focused ? colors.ai : colors.aiTint,
                  marginTop: -3,
                }}
              >
                <Icon name="spark" size={21} color={focused ? colors.onAi : colors.aiDeep} fill />
              </View>
              <Text variant="captionStrong" color={colors.aiDeep} style={{ fontSize: 10.5 }}>
                {cfg.label}
              </Text>
            </Pressable>
          );
        }

        return (
          <Pressable key={route.key} onPress={onPress} style={{ flex: 1, alignItems: 'center', gap: 4, paddingTop: 6 }}>
            <Icon name={cfg.icon} size={24} color={focused ? colors.primary : colors.muted} strokeWidth={focused ? 2.2 : 1.9} />
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
    <Tabs tabBar={(props) => <VerdantTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="properties" options={{ title: 'Properties' }} />
      <Tabs.Screen name="ai" options={{ title: 'AI' }} />
      <Tabs.Screen name="team" options={{ title: 'Team' }} />
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
    </Tabs>
  );
}
