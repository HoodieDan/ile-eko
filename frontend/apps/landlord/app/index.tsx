import { Redirect } from 'expo-router';
import React from 'react';
import { useAuth } from '@ile-eko/core';

export default function Index(): React.ReactElement {
  const { status } = useAuth();
  if (status === 'loading') return <></>;
  return status === 'authenticated' ? <Redirect href="/(tabs)" /> : <Redirect href="/(auth)/onboarding" />;
}
