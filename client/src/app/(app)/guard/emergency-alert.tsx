import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { DrawerButton } from '@/components/DrawerButton';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useCreateEmergencyAlert } from '@/features/notices/hooks/use-notices';

const QUICK_REASONS = ['Fire', 'Medical', 'Security breach', 'Water leak', 'Power outage'];

/**
 * Chapter 17 — reuses the notices/emergency-alert pipeline (Chapter 10's
 * feed, now with a guard-facing entry point): posting here creates a
 * category='emergency' notice and immediately pushes every society member,
 * with the alert framed as urgent (see notices.service.ts on the server).
 */
export default function EmergencyAlertScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [sent, setSent] = useState(false);

  const createAlert = useCreateEmergencyAlert();

  const canSend = title.trim().length > 0 && description.trim().length > 0;

  function handleSend() {
    createAlert.mutate(
      { title: title.trim(), description: description.trim() },
      {
        onSuccess: () => {
          setConfirming(false);
          setSent(true);
        },
        onError: () => setConfirming(false)
      }
    );
  }

  if (sent) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 rounded-full bg-emerald-500/10 items-center justify-center mb-4">
            <Ionicons name="checkmark-circle" size={32} color="#2f7a4f" />
          </View>
          <Text className="text-lg font-serif-semibold text-foreground text-center mb-1.5">
            Alert sent to the whole society
          </Text>
          <Text className="text-sm font-sans text-muted text-center mb-8">
            Every resident and admin has been pushed a notification and it&apos;s live on the
            Notices feed.
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="px-6 py-3.5 rounded-xl bg-primary active:bg-primary/90"
          >
            <Text className="text-primary-foreground font-sans-semibold text-sm">Done</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <View className="flex-row items-center justify-between mb-4">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={theme.foreground} />
          </Pressable>
          <Text className="text-lg font-serif-semibold text-foreground">Emergency Alert</Text>
          <DrawerButton />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <View className="p-4 rounded-2xl bg-danger/10 border border-danger/20 flex-row gap-3 mb-5">
            <Ionicons name="warning-outline" size={20} color={theme.danger} />
            <Text className="flex-1 text-xs font-sans text-danger leading-5">
              This immediately pushes a notification to every resident and admin in the society and
              posts to the Notices feed. Use only for genuine emergencies.
            </Text>
          </View>

          <Text className="text-xs font-sans-bold text-primary tracking-wider uppercase mb-2">
            Quick reason
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-5">
            {QUICK_REASONS.map((reason) => (
              <Pressable
                key={reason}
                onPress={() => setTitle(reason)}
                className={`px-3 py-2 rounded-xl border ${
                  title === reason
                    ? 'bg-danger border-danger'
                    : 'bg-card border-border active:bg-surface'
                }`}
              >
                <Text
                  className={`text-xs font-sans-semibold ${
                    title === reason ? 'text-white' : 'text-foreground'
                  }`}
                >
                  {reason}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-xs font-sans-bold text-primary tracking-wider uppercase mb-2">
            Alert title
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Fire near Tower B"
            placeholderTextColor={theme.muted}
            className="bg-card border border-border rounded-xl px-4 py-3.5 text-sm font-sans text-foreground mb-5"
          />

          <Text className="text-xs font-sans-bold text-primary tracking-wider uppercase mb-2">
            Details
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What's happening, and what should residents do?"
            placeholderTextColor={theme.muted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="bg-card border border-border rounded-xl px-4 py-3.5 text-sm font-sans text-foreground mb-6 min-h-[110px]"
          />

          <Pressable
            onPress={() => setConfirming(true)}
            disabled={!canSend || createAlert.isPending}
            className={`flex-row items-center justify-center gap-2 py-4 rounded-xl ${
              canSend ? 'bg-danger active:bg-danger/90' : 'bg-surface border border-border'
            }`}
          >
            {createAlert.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="megaphone-outline"
                  size={18}
                  color={canSend ? '#fff' : theme.muted}
                />
                <Text className={`font-sans-bold text-sm ${canSend ? 'text-white' : 'text-muted'}`}>
                  Broadcast Emergency Alert
                </Text>
              </>
            )}
          </Pressable>

          {createAlert.isError && (
            <Text className="text-xs font-sans text-danger text-center mt-3">
              Couldn&apos;t send the alert. Please try again.
            </Text>
          )}
        </ScrollView>
      </View>

      <ConfirmDialog
        visible={confirming}
        title="Send emergency alert?"
        message="This notifies every resident and admin in the society right now. This can't be undone."
        confirmLabel="Send Alert"
        destructive
        onConfirm={handleSend}
        onCancel={() => setConfirming(false)}
      />
    </Screen>
  );
}
