import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { DrawerButton } from '@/components/DrawerButton';
import { useComplaints } from '@/features/complaints/hooks/use-complaints';
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

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  security: 'Security',
  cleanliness: 'Cleanliness',
  general: 'General'
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function ComplaintsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const { data, isLoading, refetch, isRefetching } = useComplaints();
  const complaints = data ?? [];

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <View className="flex-row items-center justify-between pb-4 mb-2 border-b border-border/50">
          <View className="flex-row items-center gap-3">
            <DrawerButton />
            <View>
              <Text className="text-2xl font-serif-bold text-foreground">Complaints</Text>
              <Text className="text-xs font-sans text-muted">
                Your flat&apos;s helpdesk tickets
              </Text>
            </View>
          </View>

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
        </View>

        <Pressable
          onPress={() => router.push('/(app)/complaints/create')}
          className="flex-row items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 my-4"
        >
          <Ionicons name="add" size={18} color={theme.primaryForeground} />
          <Text className="text-sm font-sans-bold text-primary-foreground">Log complaint</Text>
        </Pressable>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : complaints.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-3 pb-20">
            <View className="w-14 h-14 rounded-full border border-primary/30 bg-card items-center justify-center mb-2">
              <Ionicons name="build-outline" size={24} color={theme.primary} />
            </View>
            <Text className="text-base font-serif-semibold text-foreground text-center">
              No complaints yet
            </Text>
            <Text className="text-sm font-sans text-foreground-secondary text-center leading-6 px-6">
              Report plumbing, electrical, or other issues and track their resolution here.
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-20"
            className="mt-2"
          >
            {complaints.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} />
            ))}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

function ComplaintCard({ complaint }: { complaint: Complaint }) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const meta = STATUS_META[complaint.status];
  const badgeColor = theme[meta.token];

  return (
    <View className="bg-card border border-border rounded-2xl p-4 mb-3">
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

      {complaint.adminComments ? (
        <View className="bg-surface rounded-xl px-3 py-2.5 mt-3">
          <Text className="text-[11px] font-sans-bold text-primary uppercase tracking-wider mb-1">
            Admin note
          </Text>
          <Text className="text-sm font-sans text-foreground-secondary leading-5">
            {complaint.adminComments}
          </Text>
        </View>
      ) : null}

      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-border/60">
        <Text className="text-[11px] font-sans text-muted">
          {complaint.raisedByUser?.name ? `Raised by ${complaint.raisedByUser.name}` : 'You'}
        </Text>
        <Text className="text-[11px] font-sans text-muted">{formatDate(complaint.createdAt)}</Text>
      </View>
    </View>
  );
}
