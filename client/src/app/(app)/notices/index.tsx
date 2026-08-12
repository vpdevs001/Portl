import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { useAppSession } from '@/lib/auth-client';
import { useDeleteNotice, useNotices } from '@/features/notices/hooks/use-notices';
import type { Notice, NoticeCategory } from '@/features/notices/services/notices';

const CATEGORY_META: Record<NoticeCategory, { label: string; icon: string; tone: BadgeTone }> = {
  emergency: { label: 'Emergency', icon: 'warning-outline', tone: 'danger' },
  maintenance: { label: 'Maintenance', icon: 'construct-outline', tone: 'warning' },
  event: { label: 'Event', icon: 'calendar-outline', tone: 'primary' },
  general: { label: 'General', icon: 'megaphone-outline', tone: 'muted' }
};

function formatExpiry(expiresAt: string | null) {
  if (!expiresAt) return null;
  return new Date(expiresAt).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function NoticesScreen() {
  const router = useRouter();
  const { data: session } = useAppSession();
  const isAdmin = session?.user?.role === 'society_admin';

  // Server already filters expiresAt IS NULL OR expiresAt > now() for
  // everyone; the board never has to think about expiry itself, it just
  // renders whatever comes back.
  const { data, isLoading, refetch, isRefetching } = useNotices();
  const notices = data ?? [];

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <ScreenHeader
          size="lg"
          title="Notices"
          subtitle="Estate announcements"
          drawer
          onRefresh={refetch}
          isRefetching={isRefetching}
        />

        {isAdmin ? (
          <Button
            label="Create notice"
            icon="add"
            onPress={() => router.push('/(app)/notices/create')}
            className="my-4"
          />
        ) : null}

        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : notices.length === 0 ? (
          <View className="flex-1 justify-center pb-20">
            <EmptyState
              icon="megaphone-outline"
              title="No notices yet"
              subtitle={
                isAdmin
                  ? 'Publish society announcements and pin important updates for all residents and guards.'
                  : 'Official society notices published by your admin will appear here.'
              }
            />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-20"
            className="mt-2"
          >
            {notices.map((notice, index) => (
              <FadeIn key={notice.id} index={index}>
                <NoticeCard notice={notice} isAdmin={isAdmin} />
              </FadeIn>
            ))}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

function NoticeCard({ notice, isAdmin }: { notice: Notice; isAdmin: boolean }) {
  const router = useRouter();
  const theme = useTheme();
  const deleteNotice = useDeleteNotice();
  const meta = CATEGORY_META[notice.category];
  const expiry = formatExpiry(notice.expiresAt);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleConfirmDelete() {
    setConfirmingDelete(false);
    deleteNotice.mutate(notice.id);
  }

  function handleEdit() {
    router.push({
      pathname: '/(app)/notices/create',
      params: {
        id: notice.id,
        title: notice.title,
        description: notice.description,
        category: notice.category,
        expiresAt: notice.expiresAt ?? ''
      }
    });
  }

  return (
    <Card className="p-4 mb-3">
      <ConfirmDialog
        visible={confirmingDelete}
        title="Delete notice"
        message={`Remove "${notice.title}" from the notice board?`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmingDelete(false)}
      />

      <View className="flex-row items-center justify-between mb-2">
        <Badge label={meta.label} icon={meta.icon} tone={meta.tone} />
        {isAdmin ? (
          <View className="flex-row items-center gap-4">
            <Pressable
              onPress={handleEdit}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={`Edit notice ${notice.title}`}
            >
              <Ionicons name="create-outline" size={16} color={theme.muted} />
            </Pressable>
            <Pressable
              onPress={() => setConfirmingDelete(true)}
              hitSlop={12}
              disabled={deleteNotice.isPending}
              accessibilityRole="button"
              accessibilityLabel={`Delete notice ${notice.title}`}
            >
              <Ionicons name="trash-outline" size={16} color={theme.muted} />
            </Pressable>
          </View>
        ) : null}
      </View>

      <Text className="text-base font-serif-semibold text-foreground">{notice.title}</Text>
      <Text className="text-sm font-sans text-foreground-secondary mt-1 leading-5">
        {notice.description}
      </Text>

      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-border/60">
        <Text className="text-[11px] font-sans text-muted">
          {notice.createdByUser?.name ? `Posted by ${notice.createdByUser.name}` : 'Society admin'}
        </Text>
        {expiry ? <Text className="text-[11px] font-sans text-muted">Expires {expiry}</Text> : null}
      </View>
    </Card>
  );
}
