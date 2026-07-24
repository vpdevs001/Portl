import { Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button in danger styling and shows a warning icon — use for delete/remove actions. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * App-styled replacement for the native `Alert.alert` confirm/cancel dialog.
 * Use this instead of `Alert.alert` anywhere a person needs to confirm a
 * destructive or important action — it picks up Portl's own theme tokens
 * (Colors, font classes) instead of the OS's native alert chrome, and stays
 * visually consistent across iOS/Android/web.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable className="flex-1 bg-black/50 items-center justify-center px-8" onPress={onCancel}>
        {/* A no-op onPress on the card itself claims the touch responder so
            taps here never bubble to the backdrop Pressable behind it. */}
        <Pressable
          onPress={() => {}}
          className="w-full max-w-sm bg-card border border-border rounded-2xl p-5"
        >
          {destructive ? (
            <View className="w-11 h-11 rounded-full bg-danger/10 items-center justify-center mb-3">
              <Ionicons name="warning-outline" size={20} color={theme.danger} />
            </View>
          ) : null}

          <Text className="text-base font-serif-semibold text-foreground">{title}</Text>
          {message ? (
            <Text className="text-sm font-sans text-foreground-secondary mt-2 leading-5">
              {message}
            </Text>
          ) : null}

          <View className="flex-row gap-3 mt-5">
            <Pressable
              onPress={onCancel}
              className="flex-1 items-center justify-center rounded-xl border border-border bg-surface py-3"
            >
              <Text className="text-sm font-sans-bold text-foreground">{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className={`flex-1 items-center justify-center rounded-xl py-3 ${
                destructive ? 'bg-danger' : 'bg-primary'
              }`}
            >
              <Text
                className={`text-sm font-sans-bold ${
                  destructive ? 'text-white' : 'text-primary-foreground'
                }`}
              >
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
