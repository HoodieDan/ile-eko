import type { Theme } from '../theme/ThemeProvider';

export interface TabBarStyleConfig {
  activeTintColor: string;
  inactiveTintColor: string;
  backgroundColor: string;
  borderTopColor: string;
  labelStyle: {
    fontFamily: string;
    fontSize: number;
    fontWeight: '600';
  };
}

export function buildTabBarStyle(theme: Theme): TabBarStyleConfig {
  return {
    activeTintColor: theme.colors.primary,
    inactiveTintColor: theme.colors.textMuted,
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
    labelStyle: {
      fontFamily: theme.typography.caption.fontFamily,
      fontSize: 11,
      fontWeight: '600',
    },
  };
}
