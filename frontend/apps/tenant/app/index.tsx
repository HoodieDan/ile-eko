import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchTenantBoot, useAuth } from '@ile-eko/core';
import { LogoMark, Text, colors, heroGradient } from '@ile-eko/ui';

/** Hard ceiling on the preload — a dead network must never trap the user here. */
const PRELOAD_TIMEOUT_MS = 8000;

/**
 * Branded splash. Browse-first: after a short beat we drop straight into the
 * Explore marketplace (no auth gate). We hold until the listings are cached so
 * Explore opens populated rather than empty. Tap to skip.
 */
export default function Splash(): React.ReactElement {
  const router = useRouter();
  const { status } = useAuth();
  const queryClient = useQueryClient();
  const [elapsed, setElapsed] = useState(false);
  const [preloaded, setPreloaded] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(12)).current;

  const go = (): void => router.replace('/(tabs)/explore');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 520, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => setElapsed(true), 1700);
    return () => clearTimeout(t);
  }, [fade, rise]);

  useEffect(() => {
    if (status === 'loading') return;
    let settled = false;
    const finish = (): void => {
      if (settled) return;
      settled = true;
      setPreloaded(true);
    };
    const timer = setTimeout(finish, PRELOAD_TIMEOUT_MS);
    void prefetchTenantBoot(queryClient, status === 'authenticated').finally(() => {
      clearTimeout(timer);
      finish();
    });
    return () => clearTimeout(timer);
  }, [status, queryClient]);

  useEffect(() => {
    if (elapsed && preloaded) router.replace('/(tabs)/explore');
  }, [elapsed, preloaded, router]);

  return (
    <Pressable style={{ flex: 1 }} onPress={go}>
      <StatusBar style="light" />
      <LinearGradient
        colors={heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <Animated.View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 22,
            opacity: fade,
            transform: [{ translateY: rise }],
          }}
        >
          <LogoMark size={76} onDark notch={colors.primaryDeep} />
          <View style={{ alignItems: 'center', gap: 10 }}>
            <Text variant="display" color="#FFFFFF">
              Ilé Èkó Homes
            </Text>
            <Text variant="label" color="rgba(255,255,255,0.75)" style={{ letterSpacing: 2.4 }}>
              Find your next Lagos home
            </Text>
          </View>
        </Animated.View>
        <View style={{ paddingBottom: 48, alignItems: 'center', gap: 14 }}>
          <ActivityIndicator color="#FFFFFF" />
          <Text variant="caption" color="rgba(255,255,255,0.6)">
            Tap to continue
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
