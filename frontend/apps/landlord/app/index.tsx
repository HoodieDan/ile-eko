import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { hasCompletedOnboarding, prefetchLandlordBoot, useAuth } from '@ile-eko/core';
import { LogoMark, Text, colors, heroGradient } from '@ile-eko/ui';

/**
 * Failure ceiling, not an early exit: without it a dead network would hold the
 * user on the splash forever. Reaching it means something is wrong, and the
 * destination screens fall back to their own loading states.
 */
const PRELOAD_TIMEOUT_MS = 8000;

/**
 * Branded splash → routes on once the minimum display time has elapsed, auth
 * status is known, and (when signed in) the dashboard's data is in the cache.
 * There is deliberately no way to tap past it: handing over early means the
 * user watches the home screen assemble itself.
 */
export default function Splash(): React.ReactElement {
  const router = useRouter();
  const { status } = useAuth();
  const queryClient = useQueryClient();
  const [elapsed, setElapsed] = useState(false);
  const [preloaded, setPreloaded] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 520, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => setElapsed(true), 1700);
    return () => clearTimeout(t);
  }, [fade, rise]);

  useEffect(() => {
    let active = true;
    void hasCompletedOnboarding('landlord').then((complete) => {
      if (active) setOnboardingComplete(complete);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    // Signed out there is nothing to warm.
    if (status !== 'authenticated') {
      setPreloaded(true);
      return;
    }
    let settled = false;
    const finish = (): void => {
      if (settled) return;
      settled = true;
      setPreloaded(true);
    };
    const timer = setTimeout(finish, PRELOAD_TIMEOUT_MS);
    void prefetchLandlordBoot(queryClient).finally(() => {
      clearTimeout(timer);
      finish();
    });
    return () => clearTimeout(timer);
  }, [status, queryClient]);

  const ready = status !== 'loading' && preloaded && onboardingComplete !== null;

  useEffect(() => {
    if (elapsed && ready) {
      if (!onboardingComplete) {
        router.replace('/(auth)/onboarding');
      } else {
        router.replace(status === 'authenticated' ? '/(tabs)' : '/(auth)/login');
      }
    }
  }, [elapsed, onboardingComplete, ready, status, router]);

  return (
    <View style={{ flex: 1 }}>
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
              Ilé Èkó
            </Text>
            <Text variant="label" color="rgba(255,255,255,0.75)" style={{ letterSpacing: 2.4 }}>
              Your Lagos home, managed
            </Text>
          </View>
        </Animated.View>
        <View style={{ paddingBottom: 48, alignItems: 'center', gap: 14 }}>
          <ActivityIndicator color="#FFFFFF" />
          <Text variant="caption" color="rgba(255,255,255,0.6)">
            Loading your portfolio…
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}
