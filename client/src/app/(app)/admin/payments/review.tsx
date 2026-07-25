import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { DrawerButton } from '@/components/DrawerButton';
import { FilterPill } from '@/components/FilterPill';
import { useDues, useSetDueStatus, useVerifyPayment } from '@/features/payments/hooks/use-payments';
import { useSocietyDetails, useUpdateSocietyUpiId } from '@/features/society/services/use-society';
import type { DueStatus, MaintenanceDue } from '@/features/payments/services/payments';

const STATUS_META: Record<
  DueStatus,
  { label: string; icon: string; token: 'danger' | 'warning' | 'success' | 'muted' }
> = {
  pending: { label: 'Pending', icon: 'time-outline', token: 'warning' },
  review: { label: 'In review', icon: 'hourglass-outline', token: 'muted' },
  paid: { label: 'Paid', icon: 'checkmark-circle-outline', token: 'success' }
};

const FILTERS: { value: DueStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'review', label: 'Review' },
  { value: 'paid', label: 'Paid' }
];

function formatPeriod(period: string) {
  const [year, month] = period.split('-').map(Number);
  if (!year || !month) return period;
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric'
  });
}

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
  const [filter, setFilter] = useState<DueStatus>('pending');
  const [upiModalOpen, setUpiModalOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useDues(filter);
  const dues = data ?? [];

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <View className="flex-row items-center justify-between mb-2">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={theme.foreground} />
          </Pressable>
          <Text className="text-lg font-serif-semibold text-foreground">Maintenance dues</Text>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setUpiModalOpen(true)}
              className="w-10 h-10 rounded-xl bg-card border border-border items-center justify-center"
            >
              <Ionicons name="qr-code-outline" size={18} color={theme.foreground} />
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
          contentContainerClassName="gap-0"
        >
          {FILTERS.map((f) => (
            <FilterPill
              key={f.value}
              label={f.label}
              active={filter === f.value}
              onPress={() => setFilter(f.value)}
            />
          ))}
        </ScrollView>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : dues.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-3 pb-20">
            <View className="w-14 h-14 rounded-full border border-primary/30 bg-card items-center justify-center mb-2">
              <Ionicons name="cash-outline" size={24} color={theme.primary} />
            </View>
            <Text className="text-base font-serif-semibold text-foreground text-center">
              Nothing here
            </Text>
            <Text className="text-sm font-sans text-foreground-secondary text-center leading-6 px-6">
              {filter === 'pending'
                ? 'No dues pending this month.'
                : filter === 'review'
                  ? 'No payment proofs waiting for review.'
                  : 'No dues marked paid yet.'}
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-20"
            className="mt-1"
          >
            {dues.map((due) => (
              <DueCard key={due.id} due={due} onViewScreenshot={(url) => setLightboxUrl(url)} />
            ))}
          </ScrollView>
        )}
      </View>

      <UpiSettingsModal
        key={upiModalOpen ? 'open' : 'closed'}
        visible={upiModalOpen}
        onClose={() => setUpiModalOpen(false)}
      />
      <ScreenshotLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </Screen>
  );
}

function DueCard({
  due,
  onViewScreenshot
}: {
  due: MaintenanceDue;
  onViewScreenshot: (url: string) => void;
}) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const meta = STATUS_META[due.status];
  const badgeColor = theme[meta.token];

  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const setDueStatus = useSetDueStatus();
  const verifyPayment = useVerifyPayment();

  const latestConfirmation = due.paymentConfirmations?.[0];

  function handleApprove() {
    if (!latestConfirmation) return;
    verifyPayment.mutate({ id: latestConfirmation.id, payload: { status: 'approved' } });
  }

  function handleReject() {
    if (!latestConfirmation || !rejectionReason.trim()) return;
    verifyPayment.mutate(
      {
        id: latestConfirmation.id,
        payload: { status: 'rejected', rejectionReason: rejectionReason.trim() }
      },
      { onSuccess: () => setRejecting(false) }
    );
  }

  function handleMarkPaid() {
    setDueStatus.mutate({ id: due.id, status: 'paid' });
  }

  function handleMarkPending() {
    setDueStatus.mutate({ id: due.id, status: 'pending' });
  }

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
        <Text className="text-[11px] font-sans text-muted uppercase tracking-wider">
          {formatPeriod(due.period)}
        </Text>
      </View>

      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-base font-serif-semibold text-foreground">
            Flat {due.flat?.flatNumber ?? '—'}
          </Text>
          <Text className="text-xl font-serif-bold text-foreground mt-0.5">₹{due.amount}</Text>
        </View>

        {due.status === 'pending' ? (
          <Pressable
            onPress={handleMarkPaid}
            disabled={setDueStatus.isPending}
            className="rounded-xl bg-primary px-4 py-2.5 items-center"
          >
            {setDueStatus.isPending ? (
              <ActivityIndicator size="small" color={theme.primaryForeground} />
            ) : (
              <Text className="text-xs font-sans-bold text-primary-foreground">Mark paid</Text>
            )}
          </Pressable>
        ) : null}

        {due.status === 'paid' ? (
          <Pressable
            onPress={handleMarkPending}
            disabled={setDueStatus.isPending}
            className="rounded-xl border border-border px-4 py-2.5 items-center"
          >
            {setDueStatus.isPending ? (
              <ActivityIndicator size="small" color={theme.foreground} />
            ) : (
              <Text className="text-xs font-sans-bold text-foreground-secondary">Mark pending</Text>
            )}
          </Pressable>
        ) : null}
      </View>

      {due.status === 'review' && latestConfirmation ? (
        <View className="mt-3 pt-3 border-t border-border/60">
          <View className="flex-row gap-3 mb-3">
            <Pressable onPress={() => onViewScreenshot(latestConfirmation.screenshot)}>
              <Image
                source={{ uri: latestConfirmation.screenshot }}
                className="w-16 h-16 rounded-xl"
              />
            </Pressable>
            <View className="flex-1">
              <Text className="text-sm font-sans-semibold text-foreground">
                {latestConfirmation.raisedByUser?.name ?? 'Resident'}
              </Text>
              <Text className="text-[11px] font-sans text-muted mt-0.5">
                Submitted {formatDate(latestConfirmation.createdAt)}
              </Text>
              {latestConfirmation.upiRef ? (
                <Text className="text-[11px] font-sans text-muted mt-1">
                  UTR: {latestConfirmation.upiRef}
                </Text>
              ) : null}
            </View>
          </View>

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
            Every resident sees this UPI ID when they pay their maintenance dues. It stays the same
            even if a different admin takes over later.
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
