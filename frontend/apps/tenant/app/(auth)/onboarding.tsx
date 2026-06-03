import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { AILabel, Button, Icon, Logo, Screen, Text, colors, withAlpha, type IconName } from '@ile-eko/ui';

interface Slide {
  icon: IconName;
  title: string;
  body: string;
  ai: boolean;
  aiLabel?: string;
}

const SLIDES: Slide[] = [
  {
    icon: 'shield',
    title: 'Only verified, vacant homes',
    body: 'Every listing is a real, available home from a verified landlord — no ghost listings, no run-around.',
    ai: false,
  },
  {
    icon: 'spark',
    title: 'Search in plain language',
    body: 'Just describe what you want — “3-bedroom in Yaba under ₦800k with good water” — and we’ll find the match.',
    ai: true,
    aiLabel: 'AI search',
  },
  {
    icon: 'message',
    title: 'Contact landlords directly',
    body: 'Enquire and arrange inspections straight with the landlord. No agents, no surprise fees.',
    ai: false,
  },
];

export default function Onboarding(): React.ReactElement {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const ref = useRef<ScrollView>(null);
  const [i, setI] = useState(0);
  const last = i === SLIDES.length - 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>): void => {
    setI(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const next = (): void => {
    if (last) router.push('/(auth)/login');
    else ref.current?.scrollTo({ x: width * (i + 1), animated: true });
  };

  return (
    <Screen>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 4 }}
      >
        <Logo size={28} />
        <Pressable
          onPress={() => router.replace('/(tabs)/explore')}
          hitSlop={8}
          style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}
        >
          <Text variant="bodyStrong" color={colors.muted}>
            Skip
          </Text>
        </Pressable>
      </View>

      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s) => {
          const tile = s.ai ? colors.ai : colors.primary;
          const art: [string, string] = s.ai
            ? [colors.aiTint, colors.surface]
            : [colors.primaryTint, colors.surface];
          return (
          <View key={s.title} style={{ width, justifyContent: 'center', paddingHorizontal: 20 }}>
            <LinearGradient
              colors={art}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={{
                height: 300,
                borderRadius: 26,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: withAlpha(tile, 0.22),
              }}
            >
              <View
                style={{
                  width: 116,
                  height: 116,
                  borderRadius: 34,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: tile,
                  shadowColor: tile,
                  shadowOffset: { width: 0, height: 18 },
                  shadowOpacity: 0.5,
                  shadowRadius: 24,
                  elevation: 8,
                }}
              >
                <Icon name={s.icon} size={54} color="#FFFFFF" strokeWidth={1.7} fill={s.ai} />
              </View>
            </LinearGradient>

            <View style={{ marginTop: 30 }}>
              {s.ai ? <AILabel>{s.aiLabel ?? 'AI'}</AILabel> : null}
              <Text variant="h1" style={{ marginTop: s.ai ? 10 : 0 }}>
                {s.title}
              </Text>
              <Text variant="body" color={colors.muted} style={{ marginTop: 12, fontSize: 15.5, lineHeight: 24 }}>
                {s.body}
              </Text>
            </View>
          </View>
          );
        })}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingBottom: 34 }}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 22 }}>
          {SLIDES.map((s, k) => (
            <View
              key={s.title}
              style={{ height: 7, borderRadius: 999, width: k === i ? 26 : 7, backgroundColor: k === i ? colors.primary : colors.line }}
            />
          ))}
        </View>
        <Button title={last ? 'Get started' : 'Next'} iconRight="fwd" onPress={next} />
      </View>
    </Screen>
  );
}
