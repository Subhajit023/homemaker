import { createContext, use, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { tapFeedback } from '@/lib/haptics';

type ToastOptions = {
  message: string;
  /** e.g. "Undo" */
  actionLabel?: string;
  onAction?: () => void;
};

type Toast = ToastOptions & { id: number };

const ToastContext = createContext<((options: ToastOptions) => void) | null>(null);

const DURATION_MS = 3500;

/** Shows short messages above the tab bar, optionally with an action such as "Undo". */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const nextId = useRef(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  function show(options: ToastOptions) {
    nextId.current += 1;
    setToast({ ...options, id: nextId.current });
  }

  return (
    <ToastContext value={show}>
      {children}
      <View
        pointerEvents="box-none"
        style={[styles.host, { bottom: insets.bottom + BottomTabInset + Spacing.two }]}>
        {toast && (
          <Animated.View
            key={toast.id}
            entering={FadeInDown.springify().damping(18)}
            exiting={FadeOutDown.duration(200)}
            style={styles.toast}>
            <ThemedText style={styles.message} numberOfLines={2}>
              {toast.message}
            </ThemedText>
            {toast.actionLabel && (
              <Pressable
                hitSlop={10}
                onPress={() => {
                  tapFeedback();
                  toast.onAction?.();
                  setToast(null);
                }}>
                <ThemedText style={styles.action}>{toast.actionLabel}</ThemedText>
              </Pressable>
            )}
          </Animated.View>
        )}
      </View>
    </ToastContext>
  );
}

export function useToast() {
  const show = use(ToastContext);
  if (!show) throw new Error('useToast must be used inside <ToastProvider>');
  return show;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    backgroundColor: '#1C1D21',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
  },
  message: {
    flex: 1,
    color: '#ffffff',
  },
  action: {
    color: '#6CB8FF',
    fontWeight: 700,
  },
});
