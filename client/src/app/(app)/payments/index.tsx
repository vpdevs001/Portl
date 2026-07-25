import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { DrawerButton } from '@/components/DrawerButton';
import { useSocietyDetails } from '@/features/society/services/use-society';
import { useConfirmPayment, useDues } from '@/features/payments/hooks/use-payments';
import type { DueStatus, MaintenanceDue } from '@/features/payments/services/payments';

const STATUS_META: Record<
  DueStatus,
  { label: string; icon: string; token: 'danger' | 'warning' | 'success' | 'muted' }
> = {
  pending: { label: 'Unpaid', icon: 'time-outline', token: 'warning' },
  review: { label: 'Under review', icon: 'hourglass-outline', token: 'muted' },
  paid: { label: 'Paid', icon: 'checkmark-circle-outline', token: 'success' }
};

export default function PaymentsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const { data, isLoading, refetch, isRefetching } = useDues();
  const { data: society } = useSocietyDetails();
  const [activeDue, setActiveDue] = useState<MaintenanceDue | null>(null);

  const dues = data ?? [];

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <View className="flex-row items-center justify-between mb-4">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={theme.foreground} />
          </Pressable>
          <Text className="text-lg font-serif-semibold text-foreground">Maintenance dues</Text>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => refetch()}
              hitSlop={12}
              className="w-10 h-10 rounded-xl bg-card border border-border items-center justify-center"
            >
              <Ionicons
                name="refresh"
                size={18}
                color={theme.foreground}
                style={isRefetching ? { opacity: 0.4 } : undefined}
              />
            </Pressable>
            <DrawerButton />
          </View>
        </View>

        <View className="bg-card border border-border rounded-2xl p-4 mb-5">
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="qr-code-outline" size={16} color={theme.primary} />
            <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider">
              Pay via UPI
            </Text>
          </View>
          <Text className="text-sm font-sans text-foreground-secondary leading-5">
            Pay your due amount to the society&apos;s UPI ID below using any UPI app, then upload
            your payment proof against the bill so it can be verified.
          </Text>
          <View className="bg-surface border border-border rounded-xl px-3 py-2.5 mt-3">
            <Text className="text-sm font-sans-bold text-foreground">
              {society?.upiId ?? 'Not set up by your admin yet'}
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : dues.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-3 pb-20">
            <View className="w-14 h-14 rounded-full border border-primary/30 bg-card items-center justify-center mb-2">
              <Ionicons name="checkmark-done-outline" size={24} color={theme.primary} />
            </View>
            <Text className="text-base font-serif-semibold text-foreground text-center">
              No dues yet
            </Text>
            <Text className="text-sm font-sans text-foreground-secondary text-center leading-6 px-6">
              Your society hasn&apos;t assigned a maintenance amount to your flat yet.
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-20">
            {dues.map((due) => (
              <DueCard key={due.id} due={due} onPay={() => setActiveDue(due)} />
            ))}
          </ScrollView>
        )}
      </View>

      <ConfirmPaymentModal due={activeDue} onClose={() => setActiveDue(null)} />
    </Screen>
  );
}

function formatPeriod(period: string) {
  // period is "YYYY-MM"
  const [year, month] = period.split('-').map(Number);
  if (!year || !month) return period;
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric'
  });
}

function DueCard({ due, onPay }: { due: MaintenanceDue; onPay: () => void }) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const meta = STATUS_META[due.status];
  const badgeColor = theme[meta.token];

  const latestConfirmation = due.paymentConfirmations?.[0];
  const wasRejected = due.status === 'pending' && latestConfirmation?.status === 'rejected';

  return (
    <View className="bg-card border border-border rounded-2xl p-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <View
          className="flex-row items-center gap-1.5 rounded-lg px-2.5 py-1"
          style={{ backgroundColor: `${badgeColor}1a` }}
        >
          <Ionicons name={meta.icon as never} size={12} color={badgeColor} />
          <Text
            className="text-[10px] font-sans-bold uppercase tracking-wider"
            style={{ color: badgeColor }}
          >
            {meta.label}
          </Text>
        </View>
      </View>

      <View className="flex-row items-end justify-between">
        <View>
          <Text className="text-base font-serif-semibold text-foreground">
            {formatPeriod(due.period)}
          </Text>
          <Text className="text-2xl font-serif-bold text-foreground mt-1">₹{due.amount}</Text>
        </View>

        {due.status !== 'paid' ? (
          <Pressable
            onPress={onPay}
            disabled={due.status === 'review'}
            className={`rounded-xl px-4 py-2.5 items-center ${
              due.status === 'review' ? 'bg-surface border border-border' : 'bg-primary'
            }`}
          >
            <Text
              className={`text-xs font-sans-bold ${
                due.status === 'review' ? 'text-foreground-secondary' : 'text-primary-foreground'
              }`}
            >
              {due.status === 'review'
                ? 'Pending review'
                : wasRejected
                  ? 'Resubmit proof'
                  : 'Pay & submit proof'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {wasRejected && latestConfirmation?.rejectionReason ? (
        <View className="flex-row items-start gap-2 mt-3 pt-3 border-t border-border/60">
          <Ionicons
            name="alert-circle-outline"
            size={14}
            color={theme.danger}
            style={{ marginTop: 1 }}
          />
          <Text className="text-xs font-sans text-danger flex-1 leading-5">
            Rejected: {latestConfirmation.rejectionReason}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function ConfirmPaymentModal({
  due,
  onClose
}: {
  due: MaintenanceDue | null;
  onClose: () => void;
}) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [upiRef, setUpiRef] = useState('');
  const [error, setError] = useState<string | null>(null);

  const confirmPayment = useConfirmPayment();

  function reset() {
    setScreenshotUri(null);
    setScreenshotBase64(null);
    setUpiRef('');
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handlePickScreenshot(source: 'camera' | 'library') {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', 'Portl needs access to take or choose a photo.');
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.6, base64: true })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, base64: true });

    if (result.canceled || !result.assets[0]) return;

    setScreenshotUri(result.assets[0].uri);
    setScreenshotBase64(result.assets[0].base64 ?? null);
  }

  async function handleSubmit() {
    if (!due) return;
    setError(null);

    if (!screenshotBase64) {
      setError('Please attach a payment screenshot');
      return;
    }

    try {
      await confirmPayment.mutateAsync({
        dueId: due.id,
        amount: Number(due.amount),
        screenshot: screenshotBase64,
        upiRef: upiRef.trim() || undefined
      });
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit payment proof');
    }
  }

  return (
    <Modal visible={!!due} transparent animationType="slide" onRequestClose={handleClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-background rounded-t-3xl px-6 pt-5 pb-8 max-h-[85%]">
          <View className="items-center mb-4">
            <View className="w-10 h-1 rounded-full bg-border" />
          </View>

          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-lg font-serif-semibold text-foreground">
              Submit payment proof
            </Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={theme.foreground} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {due ? (
              <View className="bg-card border border-border rounded-xl px-4 py-3 mb-5">
                <Text className="text-sm font-sans text-foreground-secondary">
                  {formatPeriod(due.period)}
                </Text>
                <Text className="text-xl font-serif-bold text-foreground mt-0.5">
                  ₹{due.amount}
                </Text>
              </View>
            ) : null}

            <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-3">
              Payment screenshot
            </Text>
            <View className="flex-row items-center gap-3 mb-5">
              {screenshotUri ? (
                <Image source={{ uri: screenshotUri }} className="w-16 h-16 rounded-xl" />
              ) : null}
              <Pressable
                onPress={() => handlePickScreenshot('camera')}
                className="flex-row items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5"
              >
                <Ionicons name="camera-outline" size={16} color={theme.foreground} />
                <Text className="text-xs font-sans-bold text-foreground">Take photo</Text>
              </Pressable>
              <Pressable
                onPress={() => handlePickScreenshot('library')}
                className="flex-row items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5"
              >
                <Ionicons name="image-outline" size={16} color={theme.foreground} />
                <Text className="text-xs font-sans-bold text-foreground">Choose</Text>
              </Pressable>
            </View>

            <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-2">
              UPI transaction ID / UTR (optional)
            </Text>
            <TextInput
              value={upiRef}
              onChangeText={setUpiRef}
              placeholder="e.g. 402317659821"
              placeholderTextColor={theme.muted}
              className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans mb-5"
            />

            {error ? <Text className="text-sm font-sans text-danger mb-4">{error}</Text> : null}

            <Pressable
              onPress={handleSubmit}
              disabled={confirmPayment.isPending}
              className="rounded-xl bg-primary px-4 py-4 items-center"
            >
              {confirmPayment.isPending ? (
                <ActivityIndicator size="small" color={theme.primaryForeground} />
              ) : (
                <Text className="text-sm font-sans-bold text-primary-foreground">
                  Submit for review
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
