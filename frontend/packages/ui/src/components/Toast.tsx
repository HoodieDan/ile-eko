import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../tokens/colors';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';

interface ToastState {
  msg: string;
  icon: IconName;
}

interface ToastContextValue {
  showToast: (msg: string, icon?: IconName) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => undefined });

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const showToast = useCallback(
    (msg: string, icon: IconName = 'checkCircle') => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ msg, icon });
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setToast(null));
      }, 2600);
    },
    [opacity],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      <View style={{ flex: 1 }}>
        {children}
        {toast ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: insets.bottom + 24,
            opacity,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: colors.ink,
            borderRadius: 15,
            paddingVertical: 14,
            paddingHorizontal: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 18 },
            shadowOpacity: 0.4,
            shadowRadius: 30,
            elevation: 12,
          }}
        >
          <Icon name={toast.icon} size={20} color="#8FD3A8" strokeWidth={2} />
          <Text variant="bodyStrong" color={colors.bg} style={{ flex: 1 }}>
            {toast.msg}
          </Text>
        </Animated.View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}
