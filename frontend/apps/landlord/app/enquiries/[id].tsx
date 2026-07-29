import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AppBar,
  Text,
  Eyebrow,
  Button,
  Card,
  EmptyState,
  Input,
  Avatar,
  Icon,
  PropertyThumb,
  useToast,
  colors,
  radii,
  spacing,
} from '@ile-eko/ui';
import {
  useEnquiryThread,
  useReplyEnquiry,
  useMarkEnquiryRead,
  initialsOf,
  timeAgo,
} from '@ile-eko/core';

const QUICK_REPLIES = [
  "Yes, it's still available.",
  "Let's schedule an inspection.",
  'The rent is firm for now.',
] as const;

export default function EnquiryDetail(): React.ReactElement | null {
  const router = useRouter();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: e, isLoading, isError, refetch } = useEnquiryThread(id);
  const replyEnquiry = useReplyEnquiry();
  const markRead = useMarkEnquiryRead();

  const [reply, setReply] = React.useState('');

  // Mark the thread as read once when it loads unread.
  const markedRef = React.useRef(false);
  React.useEffect(() => {
    if (e && !e.read && !markedRef.current) {
      markedRef.current = true;
      markRead.mutate(e.id);
    }
  }, [e, markRead]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <AppBar title="Enquiry" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  // Error or not-found: never a blank screen — always a way back plus a retry.
  if (isError || !e) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <AppBar title="Enquiry" onBack={() => router.back()} />
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl }}>
          <EmptyState
            icon="alert"
            title="Couldn't load this enquiry"
            message="Check your connection and try again."
          />
          <Button title="Try again" variant="secondary" onPress={() => void refetch()} />
        </View>
      </View>
    );
  }

  const send = (text?: string): void => {
    const body = (text ?? reply).trim();
    if (!body) return;
    replyEnquiry.mutate(
      { id: e.id, body },
      { onSuccess: () => showToast('Reply sent') },
    );
    setReply('');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppBar title="Enquiry" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: 120,
        }}
      >
        {/* Tenant header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Avatar initials={initialsOf(e.tenantName)} size={48} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="h2">{e.tenantName}</Text>
            <Text variant="caption" color={colors.muted}>
              {`via marketplace · ${timeAgo(e.createdAt)}`}
            </Text>
          </View>
        </View>

        {/* Related listing */}
        <Card flat padding={12} style={{ marginTop: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <PropertyThumb size={48} radius={10} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Eyebrow>Enquiring about</Eyebrow>
              <Text variant="bodyStrong" numberOfLines={1} style={{ marginTop: 1 }}>
                {e.targetLabel}
              </Text>
            </View>
          </View>
        </Card>

        {/* Message thread */}
        <View style={{ marginTop: 18, gap: spacing.md }}>
          <View
            style={{
              alignSelf: 'flex-start',
              maxWidth: '90%',
              backgroundColor: colors.surface,
              paddingVertical: 13,
              paddingHorizontal: 15,
              borderRadius: 16,
              borderTopLeftRadius: 4,
            }}
          >
            <Text variant="body" style={{ lineHeight: 21 }}>
              {e.message}
            </Text>
          </View>
          {e.replies.map((r, i) => (
            <View
              key={`${i}-${r.createdAt}`}
              style={{
                alignSelf: 'flex-end',
                maxWidth: '85%',
                backgroundColor: colors.primary,
                paddingVertical: 11,
                paddingHorizontal: 14,
                borderRadius: 16,
                borderBottomRightRadius: 4,
              }}
            >
              <Text variant="body" color={colors.onPrimary} style={{ lineHeight: 21 }}>
                {r.body}
              </Text>
            </View>
          ))}
        </View>

        {/* Quick replies */}
        {e.replies.length === 0 ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: spacing.sm,
              marginTop: spacing.lg,
            }}
          >
            {QUICK_REPLIES.map((q) => (
              <Pressable
                key={q}
                onPress={() => send(q)}
                style={{
                  minHeight: 40,
                  justifyContent: 'center',
                  paddingHorizontal: 13,
                  borderRadius: radii.pill,
                  borderWidth: 1.5,
                  borderColor: colors.line,
                  backgroundColor: colors.surface,
                }}
              >
                <Text variant="captionStrong">{q}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>

      {/* Reply composer */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.line,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Input value={reply} onChangeText={setReply} placeholder="Write a reply…" />
          </View>
          <Pressable
            onPress={() => send()}
            accessibilityLabel="Send"
            style={{
              width: 44,
              height: 44,
              borderRadius: radii.md,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="send" size={18} color={colors.onPrimary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
