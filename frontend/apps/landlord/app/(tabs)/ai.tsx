import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  AICard,
  AILabel,
  AppBar,
  BottomSheet,
  Eyebrow,
  Icon,
  IconButton,
  Markdown,
  Text,
  Input,
  colors,
  radii,
  spacing,
} from '@ile-eko/ui';
import {
  useAIChat,
  useBriefs,
  useConversation,
  useConversations,
  useDashboard,
  useProperties,
  useTenants,
  naira,
  timeAgo,
} from '@ile-eko/core';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

/**
 * Suggested prompts built from THIS landlord's live portfolio. Generic examples
 * ("How much did my Lekki properties make?") are noise when you own nothing in
 * Lekki — every suggestion here references something the user actually has.
 */
function useSuggestedPrompts(): string[] {
  const { data: dash } = useDashboard();
  const { data: properties = [] } = useProperties();
  const { data: tenants = [] } = useTenants();

  return useMemo(() => {
    const out: string[] = [];
    const s = dash?.summary;

    const overdueTenant = tenants.find((t) => t.status === 'overdue');
    if (overdueTenant) out.push(`Why is ${overdueTenant.fullName.split(' ')[0]} behind on rent?`);
    else if (s?.overdueAmt) out.push(`Who owes me the ${naira(s.overdueAmt)} outstanding?`);

    const vacant = properties.find((p) => p.status === 'vacant');
    if (vacant) out.push(`How should I price ${vacant.propertyTitle}?`);

    const areas = [...new Set(properties.map((p) => p.area).filter(Boolean))];
    if (areas[0]) out.push(`How are my ${areas[0]} properties performing?`);

    const risky = tenants.find((t) => t.risk?.band === 'high' || t.risk?.band === 'medium');
    if (risky) out.push(`Should I be worried about ${risky.fullName.split(' ')[0]}?`);

    if (tenants.length > 1) out.push('Which tenant pays most reliably?');
    if (s && s.total > 0) out.push('Summarise my portfolio this month.');

    // Fallbacks for a brand-new account with no data yet.
    if (out.length === 0) {
      out.push('What should I set up first?', 'How does rent tracking work here?');
    }
    return out.slice(0, 4);
  }, [dash, properties, tenants]);
}

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
  const prompts = useSuggestedPrompts();

  const [thread, setThread] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadId, setLoadId] = useState<string | undefined>(undefined);

  const { data: conversations = [], isLoading: loadingHistory } = useConversations();
  const loaded = useConversation(loadId);

  const thinking = chat.isPending;
  /** Once the chat starts, the intro scaffolding (briefs + prompts) gets out of the way. */
  const started = thread.length > 0;

  const scrollToEnd = (): void => scrollRef.current?.scrollToEnd({ animated: true });

  /** Pulling to the top dismisses the keyboard so the whole thread is readable. */
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>): void => {
    if (e.nativeEvent.contentOffset.y <= 4) Keyboard.dismiss();
  };

  const startNewChat = (): void => {
    setThread([]);
    setConversationId(undefined);
    setLoadId(undefined);
    setInput('');
    setHistoryOpen(false);
  };

  /** Resume a past conversation from history. */
  const openConversation = (id: string): void => {
    setLoadId(id);
    setHistoryOpen(false);
  };

  // When a past conversation finishes loading, hydrate the thread from it.
  React.useEffect(() => {
    const convo = loaded.data;
    if (!convo || convo.id !== loadId) return;
    setThread(
      convo.messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role === 'user' ? 'user' : 'ai', text: m.content })),
    );
    setConversationId(convo.id);
  }, [loaded.data, loadId]);

  const send = (raw: string): void => {
    const text = raw.trim();
    if (!text || chat.isPending) return;
    setThread((t) => [...t, { role: 'user', text }]);
    setInput('');
    requestAnimationFrame(scrollToEnd);
    chat.mutate(
      { message: text, ...(conversationId ? { conversationId } : {}) },
      {
        onSuccess: (res) => {
          setConversationId(res.conversationId);
          setThread((t) => [...t, { role: 'ai', text: res.message }]);
          requestAnimationFrame(scrollToEnd);
        },
        onError: () => {
          setThread((t) => [
            ...t,
            { role: 'ai', text: 'Sorry, I could not reach the assistant just now.' },
          ]);
          requestAnimationFrame(scrollToEnd);
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
          subtitle={started ? 'Conversation in progress' : 'Always watching your portfolio'}
          onBack={goBack}
          right={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <IconButton
                name="clock"
                variant="ghost"
                accessibilityLabel="Conversation history"
                onPress={() => setHistoryOpen(true)}
              />
              <IconButton
                name="plus"
                variant="ghost"
                accessibilityLabel="New chat"
                onPress={startNewChat}
              />
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
          onScroll={onScroll}
          scrollEventThrottle={32}
          onContentSizeChange={() => started && scrollToEnd()}
        >
          {/* Proactive briefing strip — intro scaffolding, hidden once chatting */}
          {!started && briefs.length > 0 ? (
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
          {!started ? (
            <>
              <Text
                variant="title"
                color={colors.ink}
                style={{ fontSize: 17, marginTop: spacing['2xl'], marginBottom: spacing.sm }}
              >
                Conversation
              </Text>
              {!thinking ? (
                <Text variant="caption" color={colors.muted} style={{ lineHeight: 20 }}>
                  Ask about rent, tenants, caretaker activity or pricing — I answer from your live
                  portfolio.
                </Text>
              ) : null}
            </>
          ) : (
            <View style={{ height: spacing.lg }} />
          )}
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
                    {isUser ? (
                      <Text
                        variant="body"
                        color={colors.onPrimary}
                        style={{ fontSize: 13.5, lineHeight: 20 }}
                      >
                        {m.text}
                      </Text>
                    ) : (
                      // Models emit **bold**, bullets and headings — render them
                      // rather than showing raw asterisks.
                      <View style={{ marginTop: 6 }}>
                        <Markdown color={colors.ink} style={{ fontSize: 13.5, lineHeight: 20 }}>
                          {m.text}
                        </Markdown>
                      </View>
                    )}
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

          {/* Suggested prompts — drawn from live portfolio data; intro only */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: spacing.sm,
              marginTop: spacing.lg,
              display: started ? 'none' : 'flex',
            }}
          >
            {prompts.map((p) => (
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

      {/* Conversation history */}
      <BottomSheet
        visible={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Conversations"
        subtitle="Pick up where you left off"
        scroll
      >
        <Pressable
          onPress={startNewChat}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            paddingVertical: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.line,
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: colors.aiTint,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="plus" size={19} color={colors.aiDeep} />
          </View>
          <Text variant="bodyStrong" color={colors.aiDeep}>
            Start a new chat
          </Text>
        </Pressable>

        {loadingHistory ? (
          <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : conversations.length === 0 ? (
          <Text variant="caption" color={colors.muted} style={{ paddingVertical: spacing.lg }}>
            No past conversations yet — ask the assistant something to start one.
          </Text>
        ) : (
          conversations.map((c) => {
            // The stored thread carries a system primer the user never sent.
            const count = (c.messages ?? []).filter((m) => m.role !== 'system').length;
            return (
              <Pressable
                key={c.id}
                onPress={() => openConversation(c.id)}
                style={{
                  paddingVertical: spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.line,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: spacing.md,
                  }}
                >
                  <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                    {c.title || 'Untitled conversation'}
                  </Text>
                  {c.id === conversationId ? (
                    <Text variant="captionStrong" color={colors.aiDeep}>
                      Current
                    </Text>
                  ) : null}
                </View>
                <Text variant="caption" color={colors.muted} style={{ marginTop: 2 }}>
                  {count} message{count === 1 ? '' : 's'} · {timeAgo(c.updatedAt)}
                </Text>
              </Pressable>
            );
          })
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}
