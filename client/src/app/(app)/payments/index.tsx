import { useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { Field, Input } from '@/components/ui/Input';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { useSocietyDetails } from '@/features/society/services/use-society';
import { useConfirmPayment, useDues } from '@/features/payments/hooks/use-payments';
import type { DueStatus, MaintenanceDue } from '@/features/payments/services/payments';
import { getErrorMessage } from '@/lib/errors';

const STATUS_META: Record<DueStatus, { label: string; icon: string; tone: BadgeTone }> = {
  pending: { label: 'Unpaid', icon: 'time-outline', tone: 'warning' },
  review: { label: 'Under review', icon: 'hourglass-outline', tone: 'muted' },
  paid: { label: 'Paid', icon: 'checkmark-circle-outline', tone: 'success' }
};

export default function PaymentsScreen() {
  const theme = useTheme();

  const { data, isLoading, refetch, isRefetching } = useDues();
  const { data: society } = useSocietyDetails();
  const [activeDue, setActiveDue] = useState<MaintenanceDue | null>(null);

  const dues = data ?? [];

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <ScreenHeader
          title="Maintenance dues"
          showBack
          drawer
          onRefresh={refetch}
          isRefetching={isRefetching}
        />

        <Card className="p-4 mb-5">
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="qr-code-outline" size={16} color={theme.primary} />
            <SectionLabel>Pay via UPI</SectionLabel>
          </View>
          <Text className="text-sm font-sans text-foreground-secondary leading-5">
            Pay your due amount to the society’s UPI ID below using any UPI app, then upload your
            payment proof against the bill so it can be verified.
          </Text>
          <View className="bg-surface border border-border rounded-xl px-3 py-2.5 mt-3">
            <Text className="text-sm font-sans-bold text-foreground">
              {society?.upiId ?? 'Not set up by your admin yet'}
            </Text>
          </View>
        </Card>

        {isLoading ? (
          <ListSkeleton rows={3} />
        ) : dues.length === 0 ? (
          <View className="flex-1 justify-center pb-20">
            <EmptyState
              icon="checkmark-done-outline"
              title="No dues yet"
              subtitle="Your society hasn't assigned a maintenance amount to your flat yet."
            />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-20"
            className="flex-1"
          >
            {dues.map((due, index) => (
              <FadeIn key={due.id} index={index}>
                <DueCard due={due} onPay={() => setActiveDue(due)} />
              </FadeIn>
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
  const theme = useTheme();
  const meta = STATUS_META[due.status];

  const latestConfirmation = due.paymentConfirmations?.[0];
  const wasRejected = due.status === 'pending' && latestConfirmation?.status === 'rejected';

  return (
    <Card className="p-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <Badge label={meta.label} icon={meta.icon} tone={meta.tone} />
      </View>

      <View className="flex-row items-end justify-between gap-3">
        <View className="flex-1">
          <Text className="text-base font-serif-semibold text-foreground">
            {formatPeriod(due.period)}
          </Text>
          <Text className="text-2xl font-mono-semibold text-foreground mt-1">₹{due.amount}</Text>
        </View>

        {due.status !== 'paid' ? (
          <Button
            label={
              due.status === 'review'
                ? 'Pending review'
                : wasRejected
                  ? 'Resubmit proof'
                  : 'Pay & submit proof'
            }
            size="sm"
            variant={due.status === 'review' ? 'secondary' : 'primary'}
            disabled={due.status === 'review'}
            onPress={onPay}
          />
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
    </Card>
  );
}

function ConfirmPaymentModal({
  due,
  onClose
}: {
  due: MaintenanceDue | null;
  onClose: () => void;
}) {
  const theme = useTheme();

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
      setError(getErrorMessage(e));
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
              <Card className="px-4 py-3 mb-5">
                <Text className="text-sm font-sans text-foreground-secondary">
                  {formatPeriod(due.period)}
                </Text>
                <Text className="text-xl font-mono-semibold text-foreground mt-0.5">
                  ₹{due.amount}
                </Text>
              </Card>
            ) : null}

            <SectionLabel className="mb-3">Payment screenshot</SectionLabel>
            <View className="flex-row items-center gap-3 mb-5">
              {screenshotUri ? (
                <Image source={{ uri: screenshotUri }} className="w-16 h-16 rounded-xl" />
              ) : null}
              <Button
                label="Take photo"
                icon="camera-outline"
                variant="secondary"
                size="sm"
                onPress={() => handlePickScreenshot('camera')}
              />
              <Button
                label="Choose"
                icon="image-outline"
                variant="secondary"
                size="sm"
                onPress={() => handlePickScreenshot('library')}
              />
            </View>

            <Field label="UPI transaction ID / UTR (optional)">
              <Input
                value={upiRef}
                onChangeText={setUpiRef}
                placeholder="e.g. 402317659821"
                className="mb-5"
              />
            </Field>

            {error ? <Text className="text-sm font-sans text-danger mb-4">{error}</Text> : null}

            <Button
              label="Submit for review"
              size="lg"
              loading={confirmPayment.isPending}
              onPress={handleSubmit}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
