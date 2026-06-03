import { Redirect } from 'expo-router';
import React from 'react';

// Browse-first: open straight into Explore regardless of auth state.
export default function Index(): React.ReactElement {
  return <Redirect href="/(tabs)/explore" />;
}
