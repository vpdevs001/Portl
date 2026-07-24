import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import {
  useComplaints,
  useUpdateComplaintStatus
} from '@/features/complaints/hooks/use-complaints';
import type { Complaint, ComplaintStatus } from '@/features/complaints/services/complaints';

const STATUS_META: Record<
  ComplaintStatus,
  { label: string; icon: string; token: 'danger' | 'warning' | 'success' | 'muted' }
> = {
  open: { label: 'Open', icon: 'alert-circle-outline', token: 'danger' },
  in_progress: { label: 'In progress', icon: 'time-outline', token: 'warning' },
  resolved: { label: 'Resolved', icon: 'checkmark-circle-outline', token: 'success' },
  closed: { label: 'Closed', icon: 'lock-closed-outline', token: 'muted' }
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
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const [filter, setFilter] = useState<ComplaintStatus | 'all'>('all');

  const { data, isLoading, refetch, isRefetching } = useComplaints();
  const complaints = (data ?? []).filter((c) => filter === 'all' || c.status === filter);

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <View className="flex-row items-center justify-between mb-2">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={theme.foreground} />
          </Pressable>
          <Text className="text-lg font-serif-semibold text-foreground">Manage complaints</Text>
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
        ) : complaints.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-3 pb-20">
            <View className="w-14 h-14 rounded-full border border-primary/30 bg-card items-center justify-center mb-2">
              <Ionicons name="checkmark-done-outline" size={24} color={theme.primary} />
            </View>
            <Text className="text-base font-serif-semibold text-foreground text-center">
              Nothing here
            </Text>
            <Text className="text-sm font-sans text-foreground-secondary text-center leading-6 px-6">
              {filter === 'all'
                ? 'No complaints have been raised yet.'
                : `No ${STATUS_META[filter as ComplaintStatus]?.label.toLowerCase()} tickets.`}
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-20"
            className="mt-1"
          >
            {complaints.map((complaint) => (
              <ComplaintTicket key={complaint.id} complaint={complaint} />
            ))}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

function ComplaintTicket({ complaint }: { complaint: Complaint }) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const meta = STATUS_META[complaint.status];
  const badgeColor = theme[meta.token];

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
    <View className="bg-card border border-border rounded-2xl p-4 mb-3">
      <Pressable onPress={() => setExpanded((prev) => !prev)}>
        <View className="flex-row items-center justify-between mb-2">
          <View
            className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1"
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
          <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-2">
            Update status
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-3">
            {STATUS_ORDER.map((status) => {
              const active = nextStatus === status;
              const color = theme[STATUS_META[status].token];
              return (
                <Pressable
                  key={status}
                  onPress={() => setNextStatus(status)}
                  className="flex-row items-center gap-1.5 px-3 py-2 rounded-full border"
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

          <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-2">
            Resolution note
          </Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="What was done, or what's next"
            placeholderTextColor={theme.muted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="bg-surface border border-border rounded-xl px-3 py-2.5 text-foreground font-sans text-sm min-h-[80px]"
          />

          <Pressable
            onPress={handleUpdate}
            disabled={updateStatus.isPending}
            className="rounded-xl bg-primary px-4 py-3 items-center mt-3"
          >
            {updateStatus.isPending ? (
              <ActivityIndicator size="small" color={theme.primaryForeground} />
            ) : (
              <Text className="text-sm font-sans-bold text-primary-foreground">Update ticket</Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
