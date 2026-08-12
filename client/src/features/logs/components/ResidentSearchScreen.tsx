import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { Input } from '@/components/ui/Input';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useTheme } from '@/hooks/useColorScheme';
import { useTowers } from '@/features/society/services/use-society';
import {
  useGateResidents,
  useGateStaff,
  useLogResidentEntry,
  useLogStaffEntry
} from '@/features/logs/hooks/use-logs';
import type { GateResident, GateStaff } from '@/features/logs/services/logs';

type Tab = 'residents' | 'staff';

const TAB_OPTIONS: { value: Tab; label: string }[] = [
  { value: 'residents', label: 'Residents' },
  { value: 'staff', label: 'Staff' }
];

export function ResidentSearchScreen() {
  const theme = useTheme();

  const [tab, setTab] = useState<Tab>('residents');
  const [search, setSearch] = useState('');
  const [towerId, setTowerId] = useState<string | undefined>();

  const { data: towers } = useTowers();
  const { data: residents, isLoading: residentsLoading } = useGateResidents({
    search: search || undefined,
    towerId
  });
  const { data: staff, isLoading: staffLoading } = useGateStaff(search || undefined);

  const logResident = useLogResidentEntry();
  const logStaff = useLogStaffEntry();

  const isLoading = tab === 'residents' ? residentsLoading : staffLoading;

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <ScreenHeader
          title="Gate check-in"
          subtitle="Search residents or staff and log entry or exit with one tap."
          showBack
          drawer
        />

        <SegmentedControl options={TAB_OPTIONS} value={tab} onChange={setTab} className="mb-4" />

        <View className="flex-row items-center bg-card border border-border rounded-xl px-3 mb-3">
          <Ionicons name="search-outline" size={18} color={theme.muted} />
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder={
              tab === 'residents' ? 'Search by name or flat…' : 'Search staff by name or role…'
            }
            className="flex-1 ml-2 border-0 bg-transparent px-0"
          />
        </View>

        {tab === 'residents' && towers && towers.length > 0 ? (
          <View className="flex-row flex-wrap gap-2 mb-4">
            <Chip label="All towers" selected={!towerId} onPress={() => setTowerId(undefined)} />
            {towers.map((tower) => (
              <Chip
                key={tower.id}
                label={tower.name}
                selected={towerId === tower.id}
                onPress={() => setTowerId(tower.id)}
              />
            ))}
          </View>
        ) : null}

        {isLoading ? (
          <ListSkeleton rows={5} />
        ) : tab === 'residents' ? (
          <FlatList
            data={residents ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 32, gap: 10 }}
            ListEmptyComponent={
              <EmptyState icon="people-outline" title="No residents match your search." />
            }
            renderItem={({ item, index }) => (
              <FadeIn index={index}>
                <ResidentRow
                  resident={item}
                  isPending={logResident.isPending}
                  onToggle={() =>
                    logResident.mutate({
                      userId: item.id,
                      action: item.isInside ? 'exit' : 'entry'
                    })
                  }
                />
              </FadeIn>
            )}
          />
        ) : (
          <FlatList
            data={staff ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 32, gap: 10 }}
            ListEmptyComponent={
              <EmptyState
                icon="id-card-outline"
                title="No staff found"
                subtitle="Admins can add staff in the directory."
              />
            }
            renderItem={({ item, index }) => (
              <FadeIn index={index}>
                <StaffRow
                  staff={item}
                  isPending={logStaff.isPending}
                  onToggle={() =>
                    logStaff.mutate({
                      staffId: item.id,
                      action: item.isInside ? 'exit' : 'entry'
                    })
                  }
                />
              </FadeIn>
            )}
          />
        )}
      </View>
    </Screen>
  );
}

function ResidentRow({
  resident,
  isPending,
  onToggle
}: {
  resident: GateResident;
  isPending: boolean;
  onToggle: () => void;
}) {
  const subtitle = [resident.towerName, resident.flatNumber].filter(Boolean).join(' · ');

  return (
    <View className="bg-card border border-border rounded-2xl p-4 flex-row items-center gap-3">
      <Avatar name={resident.name} image={resident.image} size={44} />
      <View className="flex-1">
        <Text className="text-sm font-sans-semibold text-foreground">{resident.name}</Text>
        {subtitle ? <Text className="text-xs font-sans text-muted mt-0.5">{subtitle}</Text> : null}
        <StatusBadge isInside={resident.isInside} />
      </View>
      <LogButton isInside={resident.isInside} isPending={isPending} onPress={onToggle} />
    </View>
  );
}

function StaffRow({
  staff,
  isPending,
  onToggle
}: {
  staff: GateStaff;
  isPending: boolean;
  onToggle: () => void;
}) {
  return (
    <View className="bg-card border border-border rounded-2xl p-4 flex-row items-center gap-3">
      <Avatar name={staff.name} image={staff.photo} size={44} />
      <View className="flex-1">
        <Text className="text-sm font-sans-semibold text-foreground">{staff.name}</Text>
        <Text className="text-xs font-sans text-muted mt-0.5">{staff.roleTitle}</Text>
        <StatusBadge isInside={staff.isInside} />
      </View>
      <LogButton isInside={staff.isInside} isPending={isPending} onPress={onToggle} />
    </View>
  );
}

function StatusBadge({ isInside }: { isInside: boolean }) {
  return (
    <Badge
      label={isInside ? 'Inside' : 'Outside'}
      tone={isInside ? 'success' : 'muted'}
      className="self-start mt-2"
    />
  );
}

function LogButton({
  isInside,
  isPending,
  onPress
}: {
  isInside: boolean;
  isPending: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={isPending}
      className={`px-4 py-2.5 rounded-xl ${isInside ? 'bg-danger/10 border border-danger/20' : 'bg-success/10 border border-success/20'} active:opacity-80`}
    >
      <Text className={`text-xs font-sans-bold ${isInside ? 'text-danger' : 'text-success'}`}>
        {isInside ? 'Log exit' : 'Log entry'}
      </Text>
    </Pressable>
  );
}
