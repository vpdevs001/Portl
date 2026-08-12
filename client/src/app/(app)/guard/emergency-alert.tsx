import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Field, Input } from '@/components/ui/Input';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useCreateEmergencyAlert } from '@/features/notices/hooks/use-notices';

const QUICK_REASONS = ['Fire', 'Medical', 'Security breach', 'Water leak', 'Power outage'];

/**
 * Reuses the notices/emergency-alert pipeline: posting here creates a
 * category='emergency' notice and immediately pushes every society member,
 * with the alert framed as urgent (see notices.service.ts on the server).
 */
export default function EmergencyAlertScreen() {
  const router = useRouter();
  const theme = useTheme();

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
          <Animated.View entering={ZoomIn.duration(450).springify().damping(14)}>
            <View className="w-16 h-16 rounded-full bg-success/15 items-center justify-center mb-4">
              <Ionicons name="checkmark-circle" size={32} color={theme.success} />
            </View>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(150).duration(400)} className="items-center">
            <Text className="text-lg font-serif-semibold text-foreground text-center mb-1.5">
              Alert sent to the whole society
            </Text>
            <Text className="text-sm font-sans text-muted text-center mb-8 leading-5">
              Every resident and admin has been pushed a notification and it’s live on the Notices
              feed.
            </Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(280).duration(400)}>
            <Button label="Done" onPress={() => router.back()} className="px-8" />
          </Animated.View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <ScreenHeader title="Emergency Alert" showBack drawer />

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

          <SectionLabel className="mb-2">Quick reason</SectionLabel>
          <View className="flex-row flex-wrap gap-2 mb-5">
            {QUICK_REASONS.map((reason) => (
              <Chip
                key={reason}
                label={reason}
                selected={title === reason}
                onPress={() => setTitle(reason)}
              />
            ))}
          </View>

          <Field label="Alert title">
            <Input value={title} onChangeText={setTitle} placeholder="e.g. Fire near Tower B" />
          </Field>

          <Field label="Details">
            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="What's happening, and what should residents do?"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="min-h-[110px]"
            />
          </Field>

          <Button
            label="Broadcast Emergency Alert"
            icon="megaphone-outline"
            variant="danger"
            size="lg"
            loading={createAlert.isPending}
            disabled={!canSend}
            onPress={() => setConfirming(true)}
            className="mt-2"
          />

          {createAlert.isError && (
            <Text className="text-xs font-sans text-danger text-center mt-3">
              Couldn’t send the alert. Please try again.
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
