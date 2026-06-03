import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, createQueryClient } from '@ile-eko/core';
import { ThemeProvider, ToastProvider, colors, fontAssets } from '@ile-eko/ui';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout(): React.ReactElement | null {
  const [fontsLoaded] = useFonts(fontAssets);
  const queryClient = useMemo(() => createQueryClient(), []);

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // Keep the splash up until the brand fonts are ready — avoids a flash of
  // system type before Bricolage/Manrope load.
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {/* Single Verdant theme — we intentionally ignore the device colour scheme. */}
          <ThemeProvider>
            <ToastProvider>
              <StatusBar style="dark" />
              <Stack
                screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}
              />
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
