import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { DrawerButton } from '@/components/DrawerButton';
import {
  useGenerateDues,
  usePaymentConfirmations,
  useVerifyPayment
} from '@/features/payments/hooks/use-payments';
import { useSocietyDetails, useUpdateSocietyUpiId } from '@/features/society/services/use-society';
import type {
  ConfirmationStatus,
  PaymentConfirmation
} from '@/features/payments/services/payments';

const STATUS_META: Record<
  ConfirmationStatus,
  { label: string; icon: string; token: 'danger' | 'warning' | 'success' | 'muted' }
> = {
  pending: { label: 'Pending review', icon: 'time-outline', token: 'warning' },
  approved: { label: 'Approved', icon: 'checkmark-circle-outline', token: 'success' },
  rejected: { label: 'Rejected', icon: 'close-circle-outline', token: 'danger' }
};

const FILTERS: { value: ConfirmationStatus | 'all'; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' }
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function ReviewPaymentsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const [filter, setFilter] = useState<ConfirmationStatus | 'all'>('pending');
  const [generateOpen, setGenerateOpen] = useState(false);
  const [upiModalOpen, setUpiModalOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = usePaymentConfirmations();
  const confirmations = (data ?? []).filter((c) => filter === 'all' || c.status === filter);

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <View className="flex-row items-center justify-between mb-2">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={theme.foreground} />
          </Pressable>
          <Text className="text-lg font-serif-semibold text-foreground">Payment reviews</Text>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setUpiModalOpen(true)}
              className="w-10 h-10 rounded-xl bg-card border border-border items-center justify-center"
            >
              <Ionicons name="qr-code-outline" size={18} color={theme.foreground} />
            </Pressable>
            <Pressable
              onPress={() => setGenerateOpen(true)}
              className="w-10 h-10 rounded-xl bg-primary items-center justify-center"
            >
              <Ionicons name="add" size={20} color={theme.primaryForeground} />
            </Pressable>
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="my-4"
          contentContainerClassName="gap-2"
        >
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <Pressable
                key={f.value}
                onPress={() => setFilter(f.value)}
                className={`px-4 py-2 rounded-full border mr-2 ${
                  active ? 'bg-primary border-primary' : 'bg-card border-border'
                }`}
              >
                <Text
                  className={`text-xs font-sans-bold ${
                    active ? 'text-primary-foreground' : 'text-foreground-secondary'
                  }`}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : confirmations.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-3 pb-20">
            <View className="w-14 h-14 rounded-full border border-primary/30 bg-card items-center justify-center mb-2">
              <Ionicons name="cash-outline" size={24} color={theme.primary} />
            </View>
            <Text className="text-base font-serif-semibold text-foreground text-center">
              Nothing here
            </Text>
            <Text className="text-sm font-sans text-foreground-secondary text-center leading-6 px-6">
              {filter === 'pending'
                ? 'No payment proofs waiting for review.'
                : `No ${filter === 'all' ? '' : filter} confirmations yet.`}
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-20"
            className="mt-1"
          >
            {confirmations.map((confirmation) => (
              <ConfirmationCard
                key={confirmation.id}
                confirmation={confirmation}
                onViewScreenshot={() => setLightboxUrl(confirmation.screenshot)}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <GenerateDuesModal visible={generateOpen} onClose={() => setGenerateOpen(false)} />
      <UpiSettingsModal key={upiModalOpen ? 'open' : 'closed'} visible={upiModalOpen} onClose={() => setUpiModalOpen(false)} />
      <ScreenshotLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </Screen>
  );
}

function ConfirmationCard({
  confirmation,
  onViewScreenshot
}: {
  confirmation: PaymentConfirmation;
  onViewScreenshot: () => void;
}) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const meta = STATUS_META[confirmation.status];
  const badgeColor = theme[meta.token];

  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const verifyPayment = useVerifyPayment();
  const isPending = confirmation.status === 'pending';

  function handleApprove() {
    verifyPayment.mutate({ id: confirmation.id, payload: { status: 'approved' } });
  }

  function handleReject() {
    if (!rejectionReason.trim()) return;
    verifyPayment.mutate(
      { id: confirmation.id, payload: { status: 'rejected', rejectionReason: rejectionReason.trim() } },
      { onSuccess: () => setRejecting(false) }
    );
  }

  return (
    <View className="bg-card border border-border rounded-2xl p-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <View
          className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ backgroundColor: `${badgeColor}1a` }}
        >
          <Ionicons name={meta.icon as never} size={12} color={badgeColor} />
          <Text className="text-[10px] font-sans-bold uppercase tracking-wider" style={{ color: badgeColor }}>
            {meta.label}
          </Text>
        </View>
        <Text className="text-[11px] font-sans text-muted uppercase tracking-wider">
          {formatDate(confirmation.createdAt)}
        </Text>
      </View>

      <View className="flex-row gap-3">
        <Pressable onPress={onViewScreenshot}>
          <Image source={{ uri: confirmation.screenshot }} className="w-16 h-16 rounded-xl" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-base font-serif-semibold text-foreground">
            ₹{confirmation.amount} · {confirmation.due?.period ?? 'Maintenance'}
          </Text>
          <Text className="text-sm font-sans text-foreground-secondary mt-1">
            {confirmation.raisedByUser?.name ?? 'Resident'}
            {confirmation.flat?.flatNumber ? ` · Flat ${confirmation.flat.flatNumber}` : ''}
          </Text>
          {confirmation.upiRef ? (
            <Text className="text-[11px] font-sans text-muted mt-1">UTR: {confirmation.upiRef}</Text>
          ) : null}
        </View>
      </View>

      {confirmation.status === 'rejected' && confirmation.rejectionReason ? (
        <View className="flex-row items-start gap-2 mt-3 pt-3 border-t border-border/60">
          <Ionicons name="alert-circle-outline" size={14} color={theme.danger} style={{ marginTop: 1 }} />
          <Text className="text-xs font-sans text-danger flex-1 leading-5">
            {confirmation.rejectionReason}
          </Text>
        </View>
      ) : null}

      {isPending ? (
        <View className="mt-3 pt-3 border-t border-border/60">
          {rejecting ? (
            <>
              <TextInput
                value={rejectionReason}
                onChangeText={setRejectionReason}
                placeholder="Reason for rejecting (shown to resident)"
                placeholderTextColor={theme.muted}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                className="bg-surface border border-border rounded-xl px-3 py-2.5 text-foreground font-sans text-sm min-h-[60px] mb-3"
              />
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setRejecting(false)}
                  className="flex-1 rounded-xl border border-border px-4 py-3 items-center"
                >
                  <Text className="text-sm font-sans-bold text-foreground-secondary">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleReject}
                  disabled={!rejectionReason.trim() || verifyPayment.isPending}
                  className="flex-1 rounded-xl bg-danger px-4 py-3 items-center"
                >
                  {verifyPayment.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-sm font-sans-bold text-white">Confirm reject</Text>
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setRejecting(true)}
                className="flex-1 rounded-xl border border-danger/40 px-4 py-3 items-center"
              >
                <Text className="text-sm font-sans-bold text-danger">Reject</Text>
              </Pressable>
              <Pressable
                onPress={handleApprove}
                disabled={verifyPayment.isPending}
                className="flex-1 rounded-xl bg-primary px-4 py-3 items-center"
              >
                {verifyPayment.isPending ? (
                  <ActivityIndicator size="small" color={theme.primaryForeground} />
                ) : (
                  <Text className="text-sm font-sans-bold text-primary-foreground">Approve</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

function ScreenshotLightbox({ url, onClose }: { url: string | null; onClose: () => void }) {
  return (
    <Modal visible={!!url} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/90 items-center justify-center" onPress={onClose}>
        {url ? (
          <Image source={{ uri: url }} className="w-[92%] h-[70%]" resizeMode="contain" />
        ) : null}
      </Pressable>
    </Modal>
  );
}

function UpiSettingsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const { data: society } = useSocietyDetails();
  const updateUpiId = useUpdateSocietyUpiId();

  const [upiId, setUpiId] = useState(society?.upiId ?? '');
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setError(null);
    onClose();
  }

  async function handleSubmit() {
    setError(null);
    const trimmed = upiId.trim();

    if (!trimmed) {
      setError('Enter a UPI ID');
      return;
    }

    try {
      await updateUpiId.mutateAsync({ upiId: trimmed });
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save UPI ID');
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-background rounded-t-3xl px-6 pt-5 pb-8">
          <View className="items-center mb-4">
            <View className="w-10 h-1 rounded-full bg-border" />
          </View>

          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-lg font-serif-semibold text-foreground">Collection UPI ID</Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={theme.foreground} />
            </Pressable>
          </View>

          <Text className="text-sm font-sans text-foreground-secondary leading-5 mb-4">
            Every resident sees this UPI ID when they pay their maintenance dues. It stays the
            same even if a different admin takes over later.
          </Text>

          <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-2">
            UPI ID
          </Text>
          <TextInput
            value={upiId}
            onChangeText={setUpiId}
            placeholder="e.g. society@okhdfcbank"
            placeholderTextColor={theme.muted}
            autoCapitalize="none"
            autoCorrect={false}
            className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans mb-4"
          />

          {error ? <Text className="text-sm font-sans text-danger mb-4">{error}</Text> : null}

          <Pressable
            onPress={handleSubmit}
            disabled={updateUpiId.isPending}
            className="rounded-xl bg-primary px-4 py-4 items-center"
          >
            {updateUpiId.isPending ? (
              <ActivityIndicator size="small" color={theme.primaryForeground} />
            ) : (
              <Text className="text-sm font-sans-bold text-primary-foreground">Save</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function GenerateDuesModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const [period, setPeriod] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateDues = useGenerateDues();

  function reset() {
    setPeriod('');
    setAmount('');
    setDueDate(new Date());
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleDateValueChange(_event: unknown, selected: Date) {
    if (Platform.OS === 'android') setShowPicker(false);
    setDueDate(selected);
  }

  function handleDatePickerDismiss() {
    if (Platform.OS === 'android') setShowPicker(false);
  }

  async function handleSubmit() {
    setError(null);

    const trimmedPeriod = period.trim();
    const parsedAmount = Number(amount);

    if (!trimmedPeriod) {
      setError('Billing period is required, e.g. "July 2026"');
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Enter a valid amount');
      return;
    }

    try {
      await generateDues.mutateAsync({
        period: trimmedPeriod,
        amount: parsedAmount,
        dueDate: dueDate.toISOString().slice(0, 10)
      });
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate dues');
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-background rounded-t-3xl px-6 pt-5 pb-8">
          <View className="items-center mb-4">
            <View className="w-10 h-1 rounded-full bg-border" />
          </View>

          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-lg font-serif-semibold text-foreground">Generate dues</Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={theme.foreground} />
            </Pressable>
          </View>

          <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-2">
            Billing period
          </Text>
          <TextInput
            value={period}
            onChangeText={setPeriod}
            placeholder="e.g. July 2026"
            placeholderTextColor={theme.muted}
            className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans mb-4"
          />

          <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-2">
            Amount per flat (₹)
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="e.g. 2500"
            placeholderTextColor={theme.muted}
            keyboardType="numeric"
            className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans mb-4"
          />

          <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-2">
            Due date
          </Text>
          <Pressable
            onPress={() => setShowPicker(true)}
            className="flex-row items-center justify-between bg-card border border-border rounded-xl px-4 py-3 mb-2"
          >
            <Text className="text-sm font-sans-semibold text-foreground">
              {dueDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
            <Ionicons name="calendar-outline" size={18} color={theme.primary} />
          </Pressable>

          {showPicker ? (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onValueChange={handleDateValueChange}
              onDismiss={handleDatePickerDismiss}
            />
          ) : null}

          <Text className="text-xs font-sans text-muted mt-3 mb-2 leading-5">
            This bills every flat in the society for this amount.
          </Text>

          <Pressable
            onPress={() => {
              handleClose();
              router.push('/(app)/admin/payments/generate-selected');
            }}
            className="flex-row items-center justify-center gap-1.5 mb-4"
          >
            <Text className="text-xs font-sans-bold text-primary">Bill specific flats instead</Text>
            <Ionicons name="arrow-forward" size={12} color={theme.primary} />
          </Pressable>

          {error ? <Text className="text-sm font-sans text-danger mb-4">{error}</Text> : null}

          <Pressable
            onPress={handleSubmit}
            disabled={generateDues.isPending}
            className="rounded-xl bg-primary px-4 py-4 items-center mt-2"
          >
            {generateDues.isPending ? (
              <ActivityIndicator size="small" color={theme.primaryForeground} />
            ) : (
              <Text className="text-sm font-sans-bold text-primary-foreground">
                Generate for all flats
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
