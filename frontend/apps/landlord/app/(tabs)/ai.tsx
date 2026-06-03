import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AICard, Body, Heading, useTheme } from '@ile-eko/ui';

// TODO: build to match Claude Design — AI assistant
export default function AITab(): React.ReactElement {
  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <Heading level={1}>Assistant</Heading>
        <AICard
          eyebrow="AI"
          title="Ask anything about your portfolio"
          body="Your AI assistant will live here. Conversation list + chat thread go on this screen."
        />
        <Body color={theme.colors.textMuted}>{/* TODO: build to match Claude Design — AI tab */}</Body>
      </View>
    </SafeAreaView>
  );
}
