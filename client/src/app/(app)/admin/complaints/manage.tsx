import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { Input } from '@/components/ui/Input';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { ListSkeleton } from '@/components/ui/Skeleton';
import {
  useComplaints,
  useUpdateComplaintStatus
} from '@/features/complaints/hooks/use-complaints';
import type { Complaint, ComplaintStatus } from '@/features/complaints/services/complaints';

const STATUS_META: Record<ComplaintStatus, { label: string; icon: string; tone: BadgeTone }> = {
  open: { label: 'Open', icon: 'alert-circle-outline', tone: 'danger' },
  in_progress: { label: 'In progress', icon: 'time-outline', tone: 'warning' },
  resolved: { label: 'Resolved', icon: 'checkmark-circle-outline', tone: 'success' },
  closed: { label: 'Closed', icon: 'lock-closed-outline', tone: 'muted' }
};

const STATUS_ORDER: ComplaintStatus[] = ['open', 'in_progress', 'resolved', 'closed'];

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  security: 'Security',
  cleanliness: 'Cleanliness',
  general: 'General'
};

const FILTERS: { value: ComplaintStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' }
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function ManageComplaintsScreen() {
  const [filter, setFilter] = useState<ComplaintStatus | 'all'>('all');

  const { data, isLoading, refetch, isRefetching } = useComplaints();
  const complaints = (data ?? []).filter((c) => filter === 'all' || c.status === filter);

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <ScreenHeader
          title="Manage complaints"
          showBack
          drawer
          onRefresh={refetch}
          isRefetching={isRefetching}
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
        ) : complaints.length === 0 ? (
          <View className="flex-1 justify-center pb-20">
            <EmptyState
              icon="checkmark-done-outline"
              title="Nothing here"
              subtitle={
                filter === 'all'
                  ? 'No complaints have been raised yet.'
                  : `No ${STATUS_META[filter as ComplaintStatus]?.label.toLowerCase()} tickets.`
              }
            />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-20"
            className="mt-1"
          >
            {complaints.map((complaint, index) => (
              <FadeIn key={complaint.id} index={index}>
                <ComplaintTicket complaint={complaint} />
              </FadeIn>
            ))}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

function ComplaintTicket({ complaint }: { complaint: Complaint }) {
  const theme = useTheme();
  const meta = STATUS_META[complaint.status];

  const [expanded, setExpanded] = useState(false);
  const [nextStatus, setNextStatus] = useState<ComplaintStatus>(complaint.status);
  const [comment, setComment] = useState(complaint.adminComments ?? '');

  const updateStatus = useUpdateComplaintStatus();

  function handleUpdate() {
    updateStatus.mutate(
      {
        id: complaint.id,
        payload: {
          status: nextStatus,
          adminComments: comment.trim() || undefined
        }
      },
      { onSuccess: () => setExpanded(false) }
    );
  }

  return (
    <Card className="p-4 mb-3">
      <Pressable onPress={() => setExpanded((prev) => !prev)}>
        <View className="flex-row items-center justify-between mb-2">
          <Badge label={meta.label} icon={meta.icon} tone={meta.tone} />
          <Text className="text-[11px] font-sans text-muted uppercase tracking-wider">
            {CATEGORY_LABELS[complaint.category] ?? complaint.category}
          </Text>
        </View>

        <View className="flex-row gap-3">
          {complaint.photoUrl ? (
            <Image source={{ uri: complaint.photoUrl }} className="w-14 h-14 rounded-xl" />
          ) : null}
          <View className="flex-1">
            <Text className="text-base font-serif-semibold text-foreground">{complaint.title}</Text>
            <Text className="text-sm font-sans text-foreground-secondary mt-1 leading-5">
              {complaint.description}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-border/60">
          <Text className="text-[11px] font-sans text-muted">
            {complaint.raisedByUser?.name ?? 'Resident'}
            {complaint.flat?.flatNumber ? ` · Flat ${complaint.flat.flatNumber}` : ''}
          </Text>
          <Text className="text-[11px] font-sans text-muted">
            {formatDate(complaint.createdAt)}
          </Text>
        </View>
      </Pressable>

      {expanded ? (
        <View className="mt-4 pt-4 border-t border-border/60">
          <SectionLabel className="mb-2">Update status</SectionLabel>
          <View className="flex-row flex-wrap gap-2 mb-3">
            {STATUS_ORDER.map((status) => {
              const active = nextStatus === status;
              const color = theme[STATUS_META[status].tone];
              return (
                <Pressable
                  key={status}
                  onPress={() => setNextStatus(status)}
                  className="flex-row items-center gap-1.5 px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: active ? `${color}1a` : theme.card,
                    borderColor: active ? color : theme.border
                  }}
                >
                  <Ionicons name={STATUS_META[status].icon as never} size={12} color={color} />
                  <Text className="text-[11px] font-sans-bold" style={{ color }}>
                    {STATUS_META[status].label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <SectionLabel className="mb-2">Resolution note</SectionLabel>
          <Input
            value={comment}
            onChangeText={setComment}
            placeholder="What was done, or what's next"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="bg-surface min-h-[80px]"
          />

          <Button
            label="Update ticket"
            loading={updateStatus.isPending}
            onPress={handleUpdate}
            className="mt-3"
          />
        </View>
      ) : null}
    </Card>
  );
}
