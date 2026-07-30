import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  AICard,
  AILabel,
  AppBar,
  Eyebrow,
  Icon,
  Input,
  Text,
  colors,
  radii,
  spacing,
} from '@ile-eko/ui';
import { useAIChat, useBriefs } from '@ile-eko/core';

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

/** A brief is "flagged" when its kind reads like a risk/alert. */
function isWarn(kind: string): boolean {
  return /flag|risk|overdue|alert/i.test(kind);
}

export default function AITab(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  /** The tab bar is hidden here, so provide the way out. */
  const goBack = (): void => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const { data: briefs = [] } = useBriefs();
  const chat = useAIChat();

  const [thread, setThread] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);

  const thinking = chat.isPending;

  const send = (raw: string): void => {
    const text = raw.trim();
    if (!text || chat.isPending) return;
    setThread((t) => [...t, { role: 'user', text }]);
    setInput('');
    chat.mutate(
      { message: text, ...(conversationId ? { conversationId } : {}) },
      {
        onSuccess: (res) => {
          setConversationId(res.conversationId);
          setThread((t) => [...t, { role: 'ai', text: res.message }]);
          scrollRef.current?.scrollToEnd({ animated: true });
        },
        onError: () => {
          setThread((t) => [
            ...t,
            { role: 'ai', text: 'Sorry, I could not reach the assistant just now.' },
          ]);
        },
      },
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Back button — the tab bar is hidden on this screen */}
        <AppBar
          title="AI Assistant"
          subtitle="Always watching your portfolio"
          onBack={goBack}
          right={
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: colors.ai,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="spark" size={19} color={colors.onAi} fill />
            </View>
          }
        />

        {/* Scrollable conversation area — takes the space above the composer */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: spacing.lg }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
        {/* Proactive briefing strip */}
        {briefs.length > 0 ? (
          <>
            <Eyebrow style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>
              Generated for you
            </Eyebrow>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -20 }}
              contentContainerStyle={{
                paddingHorizontal: 20,
                gap: spacing.md,
                paddingBottom: spacing.xs,
              }}
            >
              {briefs.map((b, i) => (
                <AICard
                  key={`${b.kind}-${i}`}
                  onPress={b.deepLink ? () => router.push(b.deepLink as never) : undefined}
                  style={{ width: 212 }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <AILabel>{b.kind}</AILabel>
                    {isWarn(b.kind) ? (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          backgroundColor: colors.danger,
                        }}
                      />
                    ) : null}
                  </View>
                  <Text variant="title" color={colors.ink} style={{ fontSize: 16, marginTop: 10 }}>
                    {b.title}
                  </Text>
                  <Text variant="caption" color={colors.muted} style={{ marginTop: 5 }}>
                    {b.body}
                  </Text>
                  {b.deepLink ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        marginTop: 11,
                      }}
                    >
                      <Text variant="captionStrong" color={colors.aiDeep}>
                        View
                      </Text>
                      <Icon name="fwd" size={14} color={colors.aiDeep} />
                    </View>
                  ) : null}
                </AICard>
              ))}
            </ScrollView>
          </>
        ) : null}

        {/* Conversation thread */}
        <Text
          variant="title"
          color={colors.ink}
          style={{ fontSize: 17, marginTop: spacing['2xl'], marginBottom: spacing.md }}
        >
          Conversation
        </Text>
        {thread.length === 0 && !thinking ? (
          <Text variant="caption" color={colors.muted} style={{ lineHeight: 20 }}>
            Ask about rent, tenants, caretaker activity or pricing — I answer from your live
            portfolio.
          </Text>
        ) : null}
        <View>
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
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      backgroundColor: colors.aiDeep,
                    }}
                  />
                ))}
              </View>
            ) : null}
          </View>
        </View>

        {/* Suggested-prompt pills */}
        <View
          style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg }}
        >
          {PROMPTS.map((p) => (
            <Pressable
              key={p}
              onPress={() => send(p)}
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
        </ScrollView>

        {/* Composer — sits on the true bottom edge and rises with the keyboard */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.md,
            backgroundColor: colors.bg,
            borderTopWidth: 1,
            borderTopColor: colors.line,
          }}
        >
          <View style={{ flex: 1 }}>
            <Input
              value={input}
              onChangeText={setInput}
              placeholder="Ask your assistant…"
              autoCapitalize="sentences"
            />
          </View>
          <Pressable
            accessibilityLabel="Send"
            disabled={!input.trim() || thinking}
            onPress={() => send(input)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: !input.trim() || thinking ? colors.aiTint : colors.ai,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon
              name="send"
              size={18}
              color={!input.trim() || thinking ? colors.aiDeep : colors.onAi}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
