import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AICard,
  AILabel,
  Eyebrow,
  Icon,
  Input,
  Screen,
  Text,
  colors,
  radii,
  spacing,
} from '@ile-eko/ui';

interface Brief {
  label: string;
  title: string;
  body: string;
  cta: string;
  onTap: () => void;
  warn?: boolean;
}

interface Message {
  role: 'user' | 'ai';
  text: string;
}

const PROMPTS: readonly string[] = [
  'How much did my Lekki properties make this year?',
  'Which tenant pays best?',
  'Summarise caretaker activity today.',
  "Who hasn't paid yet?",
];

const ANSWERS: Record<string, string> = {
  'How much did my Lekki properties make this year?':
    'Your Lekki Phase 1 flat (14 Admiralty Way) brought in ₦2,500,000 this cycle — paid in full by Chinedu Okafor in March. That’s your 2nd-highest single unit after the Ikoyi duplex (₦4,500,000). At renewal, smart pricing suggests ₦2,800,000 (+12%).',
  'Which tenant pays best?':
    'Funke Adeyemi (Ikoyi) is your most reliable — ₦4,500,000 paid in advance every year since 2022, never late. Chinedu Okafor (Lekki) is close behind. Tunde Akinola (Yaba) is weakest: currently 14 days overdue with a history of late payment.',
  'Summarise caretaker activity today.':
    'Musa Ibrahim logged 2 payments today — ₦1,500,000 for Flat 1 and a ₦750,000 part-payment for Flat 2 (Harmony Court) — and uploaded 4 inspection photos for the Gbagada flat. ⚠️ The part-payment was logged without a receipt, so I’d review that one before confirming.',
  "Who hasn't paid yet?":
    'One tenant is overdue: Tunde Akinola at 8 Herbert Macaulay Way, Yaba — 14 days late on ₦1,200,000 (78% default risk). Ngozi Eze (Surulere) is due in 21 days.',
};

const FALLBACK_ANSWER =
  'I can answer from your live portfolio — rent, tenants, caretaker activity and pricing. Try one of the suggested questions.';

export default function AITab(): React.ReactElement {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const briefs: Brief[] = [
    {
      label: 'Rent due',
      title: '₦1.65M outstanding',
      body: 'Across 2 tenants this cycle — ₦1.2M overdue in Yaba.',
      cta: 'Review',
      onTap: () => router.push('/payments/log'),
    },
    {
      label: 'Flagged',
      title: 'Receipt missing',
      body: 'A ₦750k part-payment was logged without a receipt.',
      cta: 'Open log',
      onTap: () => router.push('/activity'),
      warn: true,
    },
    {
      label: 'Occupancy',
      title: '1 unit vacant',
      body: 'Flat 3, Harmony Court — ~19% below market.',
      cta: 'View',
      onTap: () => router.push('/properties/p6'),
    },
  ];

  // Seed one example exchange so the assistant opens with a substantive answer.
  const [thread, setThread] = useState<Message[]>([
    { role: 'user', text: 'Summarise caretaker activity today.' },
    { role: 'ai', text: ANSWERS['Summarise caretaker activity today.'] ?? FALLBACK_ANSWER },
  ]);
  const [thinking, setThinking] = useState(false);

  const ask = (q: string): void => {
    setThread((t) => [...t, { role: 'user', text: q }]);
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setThread((t) => [...t, { role: 'ai', text: ANSWERS[q] ?? FALLBACK_ANSWER }]);
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 1100);
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen scroll padded bottomSpace={120}>
        {/* Header — spark mark + title */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 4 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 13,
              backgroundColor: colors.ai,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="spark" size={21} color={colors.onAi} fill />
          </View>
          <View>
            <Text variant="h2" color={colors.ink}>
              AI Assistant
            </Text>
            <AILabel>Always watching your portfolio</AILabel>
          </View>
        </View>

        {/* Proactive briefing strip */}
        <Eyebrow style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>
          Generated for you · Mon 2 Jun
        </Eyebrow>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -20 }}
          contentContainerStyle={{ paddingHorizontal: 20, gap: spacing.md, paddingBottom: spacing.xs }}
        >
          {briefs.map((b) => (
            <AICard key={b.label} onPress={b.onTap} style={{ width: 212 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <AILabel>{b.label}</AILabel>
                {b.warn ? (
                  <View
                    style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: colors.danger }}
                  />
                ) : null}
              </View>
              <Text variant="title" color={colors.ink} style={{ fontSize: 16, marginTop: 10 }}>
                {b.title}
              </Text>
              <Text variant="caption" color={colors.muted} style={{ marginTop: 5 }}>
                {b.body}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 11 }}>
                <Text variant="captionStrong" color={colors.aiDeep}>
                  {b.cta}
                </Text>
                <Icon name="fwd" size={14} color={colors.aiDeep} />
              </View>
            </AICard>
          ))}
        </ScrollView>

        {/* Conversation thread */}
        <Text
          variant="title"
          color={colors.ink}
          style={{ fontSize: 17, marginTop: spacing['2xl'], marginBottom: spacing.md }}
        >
          Conversation
        </Text>
        <ScrollView ref={scrollRef} scrollEnabled={false}>
          <View style={{ gap: spacing.sm }}>
            {thread.map((m, i) => {
              const isUser = m.role === 'user';
              return (
                <View
                  key={`${m.role}-${i}`}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '88%',
                    backgroundColor: isUser ? colors.primary : colors.aiTint,
                    paddingVertical: 11,
                    paddingHorizontal: 14,
                    borderRadius: radii.lg,
                    borderBottomRightRadius: isUser ? 4 : radii.lg,
                    borderBottomLeftRadius: isUser ? radii.lg : 4,
                    borderWidth: isUser ? 0 : 1,
                    borderColor: 'rgba(98,70,224,0.20)',
                  }}
                >
                  {!isUser ? <AILabel>Ilé Èkó AI</AILabel> : null}
                  <Text
                    variant="body"
                    color={isUser ? colors.onPrimary : colors.ink}
                    style={{ fontSize: 13.5, lineHeight: 20, marginTop: isUser ? 0 : 6 }}
                  >
                    {m.text}
                  </Text>
                </View>
              );
            })}
            {thinking ? (
              <View
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: colors.aiTint,
                  paddingVertical: 13,
                  paddingHorizontal: 16,
                  borderRadius: radii.lg,
                  borderBottomLeftRadius: 4,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {[0, 1, 2].map((d) => (
                  <View
                    key={d}
                    style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: colors.aiDeep }}
                  />
                ))}
              </View>
            ) : null}
          </View>
        </ScrollView>

        {/* Suggested-prompt pills */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg }}>
          {PROMPTS.map((p) => (
            <Pressable
              key={p}
              onPress={() => ask(p)}
              style={{
                minHeight: 42,
                justifyContent: 'center',
                paddingHorizontal: 13,
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: 'rgba(98,70,224,0.35)',
                backgroundColor: colors.surface,
              }}
            >
              <Text variant="captionStrong" color={colors.aiDeep}>
                {p}
              </Text>
            </Pressable>
          ))}
        </View>
      </Screen>

      {/* Docked input bar */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 92,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.md,
          backgroundColor: colors.bg,
          borderTopWidth: 1,
          borderTopColor: colors.line,
        }}
      >
        <View style={{ flex: 1 }}>
          <Input
            value=""
            onChangeText={() => undefined}
            placeholder="Ask your assistant…"
            editable={false}
          />
        </View>
        <Pressable
          accessibilityLabel="Send"
          style={{
            width: 40,
            height: 40,
            borderRadius: 11,
            backgroundColor: colors.ai,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="send" size={18} color={colors.onAi} />
        </Pressable>
      </View>
    </View>
  );
}
