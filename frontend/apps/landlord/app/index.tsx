import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, View } from 'react-native';
import { useAuth } from '@ile-eko/core';
import { LogoMark, Text, colors, heroGradient } from '@ile-eko/ui';

/**
 * Branded splash → routes on once both the minimum display time has elapsed and
 * auth status is known: dashboard if signed in, otherwise the onboarding flow.
 */
export default function Splash(): React.ReactElement {
  const router = useRouter();
  const { status } = useAuth();
  const [elapsed, setElapsed] = useState(false);
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
    if (elapsed && status !== 'loading') {
      router.replace(status === 'authenticated' ? '/(tabs)' : '/(auth)/onboarding');
    }
  }, [elapsed, status, router]);

  const skip = (): void => {
    if (status !== 'loading') {
      router.replace(status === 'authenticated' ? '/(tabs)' : '/(auth)/onboarding');
    }
  };

  return (
    <Pressable style={{ flex: 1 }} onPress={skip}>
      <StatusBar style="light" />
      <LinearGradient colors={heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
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
            Tap to continue
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
