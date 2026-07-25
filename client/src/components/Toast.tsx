import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren
} from 'react';
import { Animated, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { registerToastListener, type ToastVariant } from '@/lib/toast-bridge';

type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  show: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;
let nextId = 1;

/**
 * App-wide toast host. Mount once near the root (see app/_layout.tsx).
 *
 * Two ways to show a toast:
 *   - From a component: `const { show } = useToast(); show('Saved!', 'success');`
 *   - From plain code (e.g. query-client.ts's global error handlers), which
 *     can't use hooks: `import { emitToast } from '@/lib/toast-bridge'`.
 * Both end up here, since this provider registers itself as the toast-bridge
 * listener on mount.
 */
export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message: string, variant: ToastVariant = 'error') => {
    const id = nextId++;
    setToasts((current) => [...current, { id, message, variant }]);
  }, []);

  useEffect(() => {
    registerToastListener(show);
    return () => registerToastListener(null);
  }, [show]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <ToastHost toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

function ToastHost({
  toasts,
  onDismiss
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: insets.top + 8,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        gap: 8
      }}
    >
      {toasts.map((toast) => (
        <ToastBanner key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </View>
  );
}

function ToastBanner({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  // Animated.Value needs a stable identity across renders, but it's read
  // during render below (opacity/transform), which the refs lint rule
  // flags if it's held in a ref. A lazily-initialized state value gives
  // the same "create once" behavior and is safe to read during render.
  const [progress] = useState(() => new Animated.Value(0));
  const isError = toast.variant === 'error';
  const accent = isError ? theme.danger : theme.success;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: 1,
      useNativeDriver: true,
      speed: 16,
      bounciness: 6
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(progress, { toValue: 0, duration: 180, useNativeDriver: true }).start(
        onDismiss
      );
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePress() {
    Animated.timing(progress, { toValue: 0, duration: 150, useNativeDriver: true }).start(
      onDismiss
    );
  }

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] })
          }
        ],
        // Shadow so the banner reads as elevated above screen content on both platforms.
        ...(Platform.OS === 'ios'
          ? {
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 }
            }
          : { elevation: 6 })
      }}
    >
      <Pressable
        onPress={handlePress}
        className="flex-row items-start gap-2.5 rounded-xl border p-3 bg-card"
        style={{ borderColor: accent }}
      >
        <Ionicons
          name={isError ? 'alert-circle' : 'checkmark-circle'}
          size={18}
          color={accent}
          style={{ marginTop: 1 }}
        />
        <Text className="flex-1 text-sm font-sans text-foreground">{toast.message}</Text>
        <Ionicons name="close" size={16} color={theme.muted} style={{ marginTop: 2 }} />
      </Pressable>
    </Animated.View>
  );
}
