import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Avatar } from '@/components/ui/Avatar';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDues } from '@/features/payments/hooks/use-payments';
import {
  useFlats,
  useRemoveMember,
  useSocietyMembers,
  useTowers
} from '@/features/society/services/use-society';
import { useAppSession } from '@/lib/auth-client';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useColorScheme';
import { getErrorMessage } from '@/lib/errors';

// Priority when a flat somehow has more than one due row this month:
// review (a proof is actively awaiting the admin) outranks pending,
// which outranks paid, so the dot always reflects the thing needing
// the most attention.
const DUE_STATUS_RANK = { review: 2, pending: 1, paid: 0 } as const;

const DUE_DOT_META: Record<keyof typeof DUE_STATUS_RANK, { dotClass: string; label: string }> = {
  pending: { dotClass: 'bg-danger', label: 'Pending' },
  review: { dotClass: 'bg-warning', label: 'Review' },
  paid: { dotClass: 'bg-success', label: 'Paid' }
};

/**
 * Admin-only "Society Members" list — shown on the admin Home tab.
 *
 * Each row shows the member's role, their flat/tower (residents only), a
 * dues indicator dot sourced from the current month's maintenance dues for
 * their flat, and a "Remove from Society" action. The signed-in admin's
 * own row has no remove button — self-removal goes through Profile's
 * "Leave Society" instead (see society.controllers.ts removeMember, which
 * rejects targetUserId === actorId server-side too).
 */
export function SocietyMembersSection() {
  const theme = useTheme();
  const { data: session } = useAppSession();

  const { data: members, isLoading: isLoadingMembers } = useSocietyMembers();
  const { data: flats } = useFlats();
  const { data: towers } = useTowers();
  const { data: dues } = useDues();

  const removeMemberMutation = useRemoveMember();
  const [pendingRemoval, setPendingRemoval] = useState<{ id: string; name: string } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // flatId -> this month's due status for that flat ('pending' | 'review' |
  // 'paid'). No entry (undefined) means no due yet or not a resident.
  const duesByFlatId = useMemo(() => {
    const map = new Map<string, keyof typeof DUE_STATUS_RANK>();
    for (const due of dues ?? []) {
      const existing = map.get(due.flatId);
      if (!existing || DUE_STATUS_RANK[due.status] > DUE_STATUS_RANK[existing]) {
        map.set(due.flatId, due.status);
      }
    }
    return map;
  }, [dues]);

  const flatLabel = (flatId: string | null) => {
    if (!flatId) return null;
    const flat = flats?.find((f) => f.id === flatId);
    if (!flat) return null;
    const towerName = towers?.find((t) => t.id === flat.towerId)?.name;
    return towerName ? `${flat.flatNumber} · ${towerName}` : flat.flatNumber;
  };

  const handleRemove = (memberId: string, name: string) => {
    setPendingRemoval({ id: memberId, name });
  };

  const performRemove = async () => {
    if (!pendingRemoval) return;
    const { id } = pendingRemoval;
    setPendingRemoval(null);
    setError(null);
    setRemovingId(id);
    try {
      await removeMemberMutation.mutateAsync(id);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <View className="mb-6">
      <ConfirmDialog
        visible={!!pendingRemoval}
        title="Remove Member"
        message={
          pendingRemoval
            ? `Remove ${pendingRemoval.name} from the society? They'll lose their flat assignment and access immediately, and can be re-invited later.`
            : undefined
        }
        confirmLabel="Remove"
        destructive
        onConfirm={performRemove}
        onCancel={() => setPendingRemoval(null)}
      />

      <SectionLabel className="mb-3">Society Members</SectionLabel>

      {error ? (
        <View className="p-2.5 bg-danger/10 border border-danger/20 rounded-lg mb-3">
          <Text className="text-danger font-sans text-xs">{error}</Text>
        </View>
      ) : null}

      {isLoadingMembers ? (
        <View className="gap-2.5">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </View>
      ) : members && members.length > 0 ? (
        <View className="gap-2.5">
          {members.map((member) => {
            const isSelf = member.id === session?.user?.id;
            const label = flatLabel(member.flatId);
            const dueStatus = member.flatId ? duesByFlatId.get(member.flatId) : undefined;
            const dueDot = dueStatus ? DUE_DOT_META[dueStatus] : null;
            const isRemoving = removingId === member.id && removeMemberMutation.isPending;

            return (
              <View
                key={member.id}
                className="p-3.5 bg-card border border-border rounded-xl flex-row items-center gap-3"
              >
                <Avatar name={member.name} size={38} />

                {/* Identity */}
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-sm font-sans-semibold text-foreground" numberOfLines={1}>
                      {member.name}
                    </Text>
                    {isSelf && <Text className="text-[10px] font-sans text-muted">(You)</Text>}
                    {dueDot && (
                      <View
                        className="flex-row items-center gap-1"
                        accessibilityLabel={`Maintenance due: ${dueDot.label}`}
                      >
                        <View className={`w-2 h-2 rounded-full ${dueDot.dotClass}`} />
                        <Text className="text-[10px] font-sans text-muted">{dueDot.label}</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs font-sans text-muted capitalize" numberOfLines={1}>
                    {(member.role ?? 'unassigned').replace('_', ' ')}
                    {label ? ` · ${label}` : ''}
                  </Text>
                </View>

                {/* Remove action — hidden for the admin's own row */}
                {!isSelf && (
                  <Pressable
                    onPress={() => handleRemove(member.id, member.name)}
                    disabled={isRemoving}
                    hitSlop={8}
                    className="w-8 h-8 rounded-lg items-center justify-center bg-danger/10 active:bg-danger/20"
                  >
                    {isRemoving ? (
                      <ActivityIndicator size="small" color={theme.danger} />
                    ) : (
                      <Ionicons name="trash-outline" size={15} color={theme.danger} />
                    )}
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      ) : (
        <View className="p-5 bg-card border border-border border-dashed rounded-xl items-center justify-center">
          <Text className="text-xs font-sans text-muted">No members yet</Text>
        </View>
      )}
    </View>
  );
}
