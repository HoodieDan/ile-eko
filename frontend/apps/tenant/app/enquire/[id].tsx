import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppBar,
  Button,
  Card,
  Input,
  PropertyThumb,
  Text,
  colors,
  radii,
  spacing,
  useToast,
} from '@ile-eko/ui';
import { getListing, naira } from '@/data/mock';
import type { Listing } from '@/data/mock';

function listingLabel(l: Listing): string {
  if (l.type === 'Self-contain') return 'self-contain';
  return `${l.beds}-bedroom ${l.type.toLowerCase()}`;
}

const QUICK_REPLIES: readonly string[] = [
  'Is it still available?',
  'Can I inspect this weekend?',
  'Is the rent negotiable?',
];

export default function Enquire(): React.ReactElement | null {
  const router = useRouter();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const l = id ? getListing(id) : undefined;

  const [message, setMessage] = useState<string>(
    l
      ? `Hi, I'm interested in your ${listingLabel(l)} in ${l.area}. Is it still available? I'd love to arrange an inspection.`
      : '',
  );

  if (!l) return null;

  function send(): void {
    if (!message.trim()) {
      showToast('Write a short message first', 'alert');
      return;
    }
    showToast('Enquiry sent');
    router.back();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <AppBar title="Contact landlord" onBack={() => router.back()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: 140 }}
      >
        {/* Listing summary */}
        <Card flat style={{ flexDirection: 'row', alignItems: 'center', gap: 11, padding: 10 }}>
          <PropertyThumb size={48} radius={11} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="bodyStrong" style={{ fontSize: 14 }} numberOfLines={1}>
              {l.title}
            </Text>
            <Text variant="caption" color={colors.muted} numberOfLines={1} style={{ marginTop: 1 }}>
              {l.area} · {naira(l.rent)}/yr
            </Text>
          </View>
        </Card>

        {/* Message */}
        <View style={{ marginTop: spacing.lg }}>
          <Input
            label="Your message"
            value={message}
            onChangeText={setMessage}
            placeholder="Hi, is this home still available?"
            multiline
            inputStyle={{ minHeight: 110 }}
          />
        </View>

        {/* Quick replies */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md }}>
          {QUICK_REPLIES.map((q) => (
            <Pressable
              key={q}
              onPress={() => setMessage(q)}
              style={({ pressed }) => ({
                minHeight: 38,
                paddingHorizontal: spacing.md,
                borderRadius: radii.pill,
                borderWidth: 1.5,
                borderColor: colors.line,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text variant="captionStrong" color={colors.ink}>
                {q}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text variant="caption" color={colors.muted} center style={{ marginTop: spacing.lg, lineHeight: 18 }}>
          Ilé Èkó never charges agent fees. You deal directly with the landlord.
        </Text>
      </ScrollView>

      {/* Sticky send bar */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: spacing.xl,
          paddingTop: 14,
          paddingBottom: 28,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.line,
        }}
      >
        <Button title="Send enquiry" variant="primary" icon="send" onPress={send} />
      </View>
    </SafeAreaView>
  );
}
