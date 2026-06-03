import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, createQueryClient } from '@ile-eko/core';
import { ThemeProvider, ToastProvider, colors, fontAssets, setActiveTheme } from '@ile-eko/ui';

// The tenant (Homes) app wears the Adire theme so it is instantly
// distinguishable from the Verdant landlord app. Set before first render.
setActiveTheme('adire');

void SplashScreen.preventAutoHideAsync();

export default function RootLayout(): React.ReactElement | null {
  const [fontsLoaded] = useFonts(fontAssets);
  const queryClient = useMemo(() => createQueryClient(), []);

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {/* Adire theme (set above) — we intentionally ignore the device colour scheme. */}
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
