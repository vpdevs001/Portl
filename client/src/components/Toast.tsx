import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren
} from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';
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
        gap: 8,
        zIndex: 100
      }}
    >
      {toasts.map((toast) => (
        <ToastBanner key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </View>
  );
}

function ToastBanner({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const theme = useTheme();
  const isError = toast.variant === 'error';
  const accent = isError ? theme.danger : theme.success;

  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      entering={FadeInDown.duration(350).springify().damping(18).stiffness(200)}
      exiting={FadeOutUp.duration(200)}
      style={
        Platform.OS === 'ios'
          ? {
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 }
            }
          : { elevation: 6 }
      }
    >
      <Pressable
        onPress={onDismiss}
        className="flex-row items-center gap-2.5 rounded-xl border p-3 bg-card"
        style={{ borderColor: `${accent}55` }}
      >
        <Ionicons name={isError ? 'alert-circle' : 'checkmark-circle'} size={18} color={accent} />
        <Text className="flex-1 text-sm font-sans-medium text-foreground">{toast.message}</Text>
        <Ionicons name="close" size={16} color={theme.muted} />
      </Pressable>
    </Animated.View>
  );
}
