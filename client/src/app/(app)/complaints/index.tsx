import { Image, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { useComplaints } from '@/features/complaints/hooks/use-complaints';
import type { Complaint, ComplaintStatus } from '@/features/complaints/services/complaints';

const STATUS_META: Record<ComplaintStatus, { label: string; icon: string; tone: BadgeTone }> = {
  open: { label: 'Open', icon: 'alert-circle-outline', tone: 'danger' },
  in_progress: { label: 'In progress', icon: 'time-outline', tone: 'warning' },
  resolved: { label: 'Resolved', icon: 'checkmark-circle-outline', tone: 'success' },
  closed: { label: 'Closed', icon: 'lock-closed-outline', tone: 'muted' }
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
  const { data, isLoading, refetch, isRefetching } = useComplaints();
  const complaints = data ?? [];

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <ScreenHeader
          size="lg"
          title="Complaints"
          subtitle="Your flat's helpdesk tickets"
          drawer
          onRefresh={refetch}
          isRefetching={isRefetching}
        />

        <Button
          label="Log complaint"
          icon="add"
          onPress={() => router.push('/(app)/complaints/create')}
          className="my-4"
        />

        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : complaints.length === 0 ? (
          <View className="flex-1 justify-center pb-20">
            <EmptyState
              icon="build-outline"
              title="No complaints yet"
              subtitle="Report plumbing, electrical, or other issues and track their resolution here."
            />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-20"
            className="mt-2"
          >
            {complaints.map((complaint, index) => (
              <FadeIn key={complaint.id} index={index}>
                <ComplaintCard complaint={complaint} />
              </FadeIn>
            ))}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

function ComplaintCard({ complaint }: { complaint: Complaint }) {
  const meta = STATUS_META[complaint.status];

  return (
    <Card className="p-4 mb-3">
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

      {complaint.adminComments ? (
        <View className="bg-surface rounded-xl px-3 py-2.5 mt-3">
          <SectionLabel className="text-[11px] mb-1">Admin note</SectionLabel>
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
    </Card>
  );
}
