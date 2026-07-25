import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
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
import { naira, useAuth, useListing, useSendEnquiry, type ListingDetail } from '@ile-eko/core';

function listingLabel(l: ListingDetail): string {
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status } = useAuth();
  const { data: listing, isLoading } = useListing(id);

  if (status === 'loading' || isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
        <AppBar title="Contact landlord" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (status !== 'authenticated') return <Redirect href="/(auth)/login" />;
  if (!listing) return null;

  return <EnquireForm listing={listing} listingId={id} />;
}

function EnquireForm({
  listing,
  listingId,
}: {
  listing: ListingDetail;
  listingId: string;
}): React.ReactElement {
  const router = useRouter();
  const { showToast } = useToast();
  const sendEnquiry = useSendEnquiry();

  const [message, setMessage] = useState<string>(
    `Hi, I'm interested in your ${listingLabel(listing)} in ${listing.area}. Is it still available? I'd love to arrange an inspection.`,
  );

  function send(): void {
    const text = message.trim();
    if (!text) {
      showToast('Write a short message first', 'alert');
      return;
    }
    sendEnquiry.mutate(
      { listingId, message: text },
      {
        onSuccess: () => {
          showToast('Enquiry sent');
          router.back();
        },
        onError: () => {
          showToast('Could not send. Please try again.', 'alert');
        },
      },
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <AppBar title="Contact landlord" onBack={() => router.back()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.sm,
          paddingBottom: 140,
        }}
      >
        {/* Listing summary */}
        <Card flat style={{ flexDirection: 'row', alignItems: 'center', gap: 11, padding: 10 }}>
          <PropertyThumb size={48} radius={11} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="bodyStrong" style={{ fontSize: 14 }} numberOfLines={1}>
              {listing.title}
            </Text>
            <Text variant="caption" color={colors.muted} numberOfLines={1} style={{ marginTop: 1 }}>
              {listing.area} · {naira(listing.rent)}/yr
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
        <View
          style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md }}
        >
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

        <Text
          variant="caption"
          color={colors.muted}
          center
          style={{ marginTop: spacing.lg, lineHeight: 18 }}
        >
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
        <Button
          title="Send enquiry"
          variant="primary"
          icon="send"
          loading={sendEnquiry.isPending}
          onPress={send}
        />
      </View>
    </SafeAreaView>
  );
}
