import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Heading, useTheme } from '@ile-eko/ui';

// TODO: build to match Claude Design — Team tab (caretakers + per-property RolePermission)
export default function TeamTab(): React.ReactElement {
  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.md }}>
        <Heading level={1}>Team</Heading>
        <Body color={theme.colors.textMuted}>
          Invite caretakers and configure per-property permissions. {/* TODO: Claude Design */}
        </Body>
      </View>
    </SafeAreaView>
  );
}
