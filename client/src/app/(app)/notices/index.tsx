import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { DrawerButton } from '@/components/DrawerButton';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useAppSession } from '@/lib/auth-client';
import { useDeleteNotice, useNotices } from '@/features/notices/hooks/use-notices';
import type { Notice, NoticeCategory } from '@/features/notices/services/notices';

const CATEGORY_META: Record<
  NoticeCategory,
  { label: string; icon: string; token: 'danger' | 'warning' | 'primary' | 'muted' }
> = {
  emergency: { label: 'Emergency', icon: 'warning-outline', token: 'danger' },
  maintenance: { label: 'Maintenance', icon: 'construct-outline', token: 'warning' },
  event: { label: 'Event', icon: 'calendar-outline', token: 'primary' },
  general: { label: 'General', icon: 'megaphone-outline', token: 'muted' }
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
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
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
        <View className="flex-row items-center justify-between pb-4 mb-2 border-b border-border/50">
          <View className="flex-row items-center gap-3">
            <DrawerButton />
            <View>
              <Text className="text-2xl font-serif-bold text-foreground">Notices</Text>
              <Text className="text-xs font-sans text-muted">Estate announcements</Text>
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

        {isAdmin ? (
          <Pressable
            onPress={() => router.push('/(app)/notices/create')}
            className="flex-row items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 my-4"
          >
            <Ionicons name="add" size={18} color={theme.primaryForeground} />
            <Text className="text-sm font-sans-bold text-primary-foreground">Create notice</Text>
          </Pressable>
        ) : null}

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : notices.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-3 pb-20">
            <View className="w-14 h-14 rounded-full border border-primary/30 bg-card items-center justify-center mb-2">
              <Ionicons name="megaphone-outline" size={24} color={theme.primary} />
            </View>
            <Text className="text-base font-serif-semibold text-foreground text-center">
              No notices yet
            </Text>
            <Text className="text-sm font-sans text-foreground-secondary text-center leading-6 px-6">
              {isAdmin
                ? 'Publish society announcements and pin important updates for all residents and guards.'
                : 'Official society notices published by your admin will appear here.'}
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-20"
            className="mt-2"
          >
            {notices.map((notice) => (
              <NoticeCard key={notice.id} notice={notice} isAdmin={isAdmin} />
            ))}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

function NoticeCard({ notice, isAdmin }: { notice: Notice; isAdmin: boolean }) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const deleteNotice = useDeleteNotice();
  const meta = CATEGORY_META[notice.category];
  const badgeColor = theme[meta.token];
  const expiry = formatExpiry(notice.expiresAt);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleConfirmDelete() {
    setConfirmingDelete(false);
    deleteNotice.mutate(notice.id);
  }

  return (
    <View className="bg-card border border-border rounded-2xl p-4 mb-3">
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
        {isAdmin ? (
          <Pressable
            onPress={() => setConfirmingDelete(true)}
            hitSlop={12}
            disabled={deleteNotice.isPending}
          >
            <Ionicons name="trash-outline" size={16} color={theme.muted} />
          </Pressable>
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
    </View>
  );
}
