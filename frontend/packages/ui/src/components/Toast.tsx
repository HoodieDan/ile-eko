import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Body } from './Typography';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export interface ToastShape {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [toasts, setToasts] = useState<ToastShape[]>([]);
  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);
  const value = useMemo(() => ({ show }), [show]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} />
    </ToastContext.Provider>
  );
}

function ToastStack({ toasts }: { toasts: ToastShape[] }): React.ReactElement {
  const theme = useTheme();
  return (
    <View pointerEvents="none" style={styles.stack}>
      {toasts.map((t) => {
        const bg =
          t.tone === 'success'
            ? theme.colors.success
            : t.tone === 'warning'
              ? theme.colors.warning
              : t.tone === 'danger'
                ? theme.colors.danger
                : theme.colors.primary;
        return (
          <Animated.View
            key={t.id}
            style={[
              styles.toast,
              {
                backgroundColor: bg,
                borderRadius: theme.radii.md,
                marginBottom: theme.spacing.sm,
              },
            ]}
          >
            <Body color="#FFFFFF">{t.message}</Body>
          </Animated.View>
        );
      })}
    </View>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

const styles = StyleSheet.create({
  stack: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  toast: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});
