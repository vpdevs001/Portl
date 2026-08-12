import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { HeaderIconButton, ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { Field, Input } from '@/components/ui/Input';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { getErrorMessage } from '@/lib/errors';
import { useDues, useSetDueStatus, useVerifyPayment } from '@/features/payments/hooks/use-payments';
import { useSocietyDetails, useUpdateSocietyUpiId } from '@/features/society/services/use-society';
import type { DueStatus, MaintenanceDue } from '@/features/payments/services/payments';

const STATUS_META: Record<DueStatus, { label: string; icon: string; tone: BadgeTone }> = {
  pending: { label: 'Pending', icon: 'time-outline', tone: 'warning' },
  review: { label: 'In review', icon: 'hourglass-outline', tone: 'muted' },
  paid: { label: 'Paid', icon: 'checkmark-circle-outline', tone: 'success' }
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
  const [filter, setFilter] = useState<DueStatus>('pending');
  const [upiModalOpen, setUpiModalOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useDues(filter);
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
          right={<HeaderIconButton icon="qr-code-outline" onPress={() => setUpiModalOpen(true)} />}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="my-4"
          contentContainerClassName="gap-2"
        >
          {FILTERS.map((f) => (
            <Chip
              key={f.value}
              label={f.label}
              selected={filter === f.value}
              onPress={() => setFilter(f.value)}
            />
          ))}
        </ScrollView>

        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : dues.length === 0 ? (
          <View className="flex-1 justify-center pb-20">
            <EmptyState
              icon="cash-outline"
              title="Nothing here"
              subtitle={
                filter === 'pending'
                  ? 'No dues pending this month.'
                  : filter === 'review'
                    ? 'No payment proofs waiting for review.'
                    : 'No dues marked paid yet.'
              }
            />
          </View>
        ) : (
          <ScrollView
            key={filter}
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-20"
            className="flex-1 mt-1"
          >
            {dues.map((due, index) => (
              <FadeIn key={due.id} index={index}>
                <DueCard due={due} onViewScreenshot={(url) => setLightboxUrl(url)} />
              </FadeIn>
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
  const meta = STATUS_META[due.status];

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
    <Card className="p-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <Badge label={meta.label} icon={meta.icon} tone={meta.tone} />
        <Text className="text-[11px] font-sans text-muted uppercase tracking-wider">
          {formatPeriod(due.period)}
        </Text>
      </View>

      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-base font-serif-semibold text-foreground">
            Flat {due.flat?.flatNumber ?? '—'}
          </Text>
          <Text className="text-xl font-mono-semibold text-foreground mt-0.5">₹{due.amount}</Text>
        </View>

        {due.status === 'pending' ? (
          <Button
            label="Mark paid"
            size="sm"
            loading={setDueStatus.isPending}
            onPress={handleMarkPaid}
          />
        ) : null}

        {due.status === 'paid' ? (
          <Button
            label="Mark pending"
            variant="secondary"
            size="sm"
            loading={setDueStatus.isPending}
            onPress={handleMarkPending}
          />
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
              <Input
                value={rejectionReason}
                onChangeText={setRejectionReason}
                placeholder="Reason for rejecting (shown to resident)"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                className="bg-surface min-h-[60px] mb-3"
              />
              <View className="flex-row gap-2">
                <Button
                  label="Cancel"
                  variant="secondary"
                  size="sm"
                  haptic={false}
                  onPress={() => setRejecting(false)}
                  className="flex-1 py-3"
                />
                <Button
                  label="Confirm reject"
                  variant="danger"
                  size="sm"
                  loading={verifyPayment.isPending}
                  disabled={!rejectionReason.trim()}
                  onPress={handleReject}
                  className="flex-1 py-3"
                />
              </View>
            </>
          ) : (
            <View className="flex-row gap-2">
              <Button
                label="Reject"
                variant="dangerSoft"
                size="sm"
                onPress={() => setRejecting(true)}
                className="flex-1 py-3"
              />
              <Button
                label="Approve"
                size="sm"
                loading={verifyPayment.isPending}
                onPress={handleApprove}
                className="flex-1 py-3"
              />
            </View>
          )}
        </View>
      ) : null}
    </Card>
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
  const theme = useTheme();

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
      setError(getErrorMessage(e));
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

          <Field label="UPI ID">
            <Input
              value={upiId}
              onChangeText={setUpiId}
              placeholder="e.g. society@okhdfcbank"
              autoCapitalize="none"
              autoCorrect={false}
              className="mb-4"
            />
          </Field>

          {error ? <Text className="text-sm font-sans text-danger mb-4">{error}</Text> : null}

          <Button label="Save" size="lg" loading={updateUpiId.isPending} onPress={handleSubmit} />
        </View>
      </View>
    </Modal>
  );
}
