import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'ile-eko.auth.token';
const ONBOARDING_KEYS = {
  landlord: 'ile-eko.onboarding.landlord.completed.v1',
  tenant: 'ile-eko.onboarding.tenant.completed.v1',
} as const;

export type OnboardingApp = keyof typeof ONBOARDING_KEYS;

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

/**
 * Onboarding is device-scoped, not session-scoped. Its flag deliberately lives
 * outside SecureStore so signing out only removes credentials, never this app
 * preference.
 */
export async function hasCompletedOnboarding(app: OnboardingApp): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_KEYS[app])) === 'true';
  } catch {
    return false;
  }
}

export async function completeOnboarding(app: OnboardingApp): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEYS[app], 'true');
}
