import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AppBar,
  Text,
  Eyebrow,
  Card,
  Input,
  Avatar,
  Icon,
  PropertyThumb,
  useToast,
  colors,
  radii,
  spacing,
} from '@ile-eko/ui';
import { enquiries, getProperty } from '@/data/mock';

const QUICK_REPLIES = [
  "Yes, it's still available.",
  "Let's schedule an inspection.",
  'The rent is firm for now.',
] as const;

export default function EnquiryDetail(): React.ReactElement | null {
  const router = useRouter();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();

  const e = enquiries.find((x) => x.id === id);
  if (!e) return null;

  const prop = getProperty(e.propertyId);
  const [reply, setReply] = React.useState('');
  const [sent, setSent] = React.useState<string[]>([]);

  const send = (text?: string): void => {
    const t = (text ?? reply).trim();
    if (!t) return;
    setSent((s) => [...s, t]);
    setReply('');
    showToast('Reply sent');
  };

  const propMeta = prop
    ? prop.multiUnit
      ? `${e.area} · ${prop.unitCount ?? 0} units`
      : `${e.area} · ${prop.type}`
    : e.area;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppBar title="Enquiry" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: 120 }}
      >
        {/* Tenant header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Avatar initials={e.initials} size={48} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="h2">{e.tenant}</Text>
            <Text variant="caption" color={colors.muted}>
              {`via marketplace · ${e.when}`}
            </Text>
          </View>
        </View>

        {/* Related property */}
        {prop ? (
          <Card
            flat
            padding={12}
            onPress={() => router.push(`/properties/${prop.id}`)}
            style={{ marginTop: spacing.lg }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <PropertyThumb size={48} radius={10} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Eyebrow>Enquiring about</Eyebrow>
                <Text variant="bodyStrong" numberOfLines={1} style={{ marginTop: 1 }}>
                  {prop.address}
                </Text>
                <Text variant="caption" color={colors.muted} numberOfLines={1}>
                  {propMeta}
                </Text>
              </View>
              <Icon name="fwd" size={18} color={colors.muted} />
            </View>
          </Card>
        ) : null}

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
          {sent.map((t, i) => (
            <View
              key={`${i}-${t}`}
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
                {t}
              </Text>
            </View>
          ))}
        </View>

        {/* Quick replies */}
        {sent.length === 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg }}>
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
