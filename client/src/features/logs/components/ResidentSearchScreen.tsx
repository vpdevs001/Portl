import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Image } from 'expo-image';
import { Screen } from '@/components/Screen';
import { DrawerButton } from '@/components/DrawerButton';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTowers } from '@/features/society/services/use-society';
import {
  useGateResidents,
  useGateStaff,
  useLogResidentEntry,
  useLogStaffEntry
} from '@/features/logs/hooks/use-logs';
import type { GateResident, GateStaff } from '@/features/logs/services/logs';

type Tab = 'residents' | 'staff';

export function ResidentSearchScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

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
        <View className="flex-row items-center justify-between mb-4">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={theme.foreground} />
          </Pressable>
          <Text className="text-lg font-serif-semibold text-foreground">Gate check-in</Text>
          <DrawerButton />
        </View>

        <Text className="text-xs font-sans text-muted mb-4">
          Search residents or staff and log entry or exit with one tap.
        </Text>

        <View className="flex-row bg-surface rounded-xl p-1 mb-4">
          {(['residents', 'staff'] as Tab[]).map((value) => (
            <Pressable
              key={value}
              onPress={() => setTab(value)}
              className={`flex-1 items-center py-2.5 rounded-lg ${tab === value ? 'bg-card' : ''}`}
            >
              <Text
                className={`text-xs font-sans-bold capitalize ${tab === value ? 'text-primary' : 'text-muted'}`}
              >
                {value}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={tab === 'residents' ? 'Search by name or flat…' : 'Search staff by name or role…'}
          placeholderTextColor={theme.muted}
          className="bg-card border border-border rounded-xl px-4 py-3 text-foreground font-sans text-sm mb-3"
        />

        {tab === 'residents' && towers && towers.length > 0 ? (
          <View className="flex-row flex-wrap gap-2 mb-4">
            <FilterChip
              label="All towers"
              active={!towerId}
              onPress={() => setTowerId(undefined)}
            />
            {towers.map((tower) => (
              <FilterChip
                key={tower.id}
                label={tower.name}
                active={towerId === tower.id}
                onPress={() => setTowerId(tower.id)}
              />
            ))}
          </View>
        ) : null}

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : tab === 'residents' ? (
          <FlatList
            data={residents ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 32, gap: 10 }}
            ListEmptyComponent={
              <EmptyState message="No residents match your search." icon="people-outline" />
            }
            renderItem={({ item }) => (
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
            )}
          />
        ) : (
          <FlatList
            data={staff ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 32, gap: 10 }}
            ListEmptyComponent={
              <EmptyState
                message="No staff found. Admins can add staff in the directory (Chapter 14)."
                icon="badge-outline"
              />
            }
            renderItem={({ item }) => (
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
            )}
          />
        )}
      </View>
    </Screen>
  );
}

function FilterChip({
  label,
  active,
  onPress
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-3 py-1.5 rounded-full border ${active ? 'bg-primary/10 border-primary/30' : 'bg-card border-border'}`}
    >
      <Text className={`text-xs font-sans-semibold ${active ? 'text-primary' : 'text-muted'}`}>
        {label}
      </Text>
    </Pressable>
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
      <Avatar name={resident.name} image={resident.image} />
      <View className="flex-1">
        <Text className="text-sm font-sans-semibold text-foreground">{resident.name}</Text>
        {subtitle ? <Text className="text-xs font-sans text-muted mt-0.5">{subtitle}</Text> : null}
        <StatusBadge isInside={resident.isInside} />
      </View>
      <Pressable
        onPress={onToggle}
        disabled={isPending}
        className={`px-4 py-2.5 rounded-xl ${resident.isInside ? 'bg-danger/10 border border-danger/20' : 'bg-success/10 border border-success/20'} active:opacity-80`}
      >
        <Text
          className={`text-xs font-sans-bold ${resident.isInside ? 'text-danger' : 'text-success'}`}
        >
          {resident.isInside ? 'Log exit' : 'Log entry'}
        </Text>
      </Pressable>
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
      <Avatar name={staff.name} image={staff.photo} />
      <View className="flex-1">
        <Text className="text-sm font-sans-semibold text-foreground">{staff.name}</Text>
        <Text className="text-xs font-sans text-muted mt-0.5">{staff.roleTitle}</Text>
        <StatusBadge isInside={staff.isInside} />
      </View>
      <Pressable
        onPress={onToggle}
        disabled={isPending}
        className={`px-4 py-2.5 rounded-xl ${staff.isInside ? 'bg-danger/10 border border-danger/20' : 'bg-success/10 border border-success/20'} active:opacity-80`}
      >
        <Text className={`text-xs font-sans-bold ${staff.isInside ? 'text-danger' : 'text-success'}`}>
          {staff.isInside ? 'Log exit' : 'Log entry'}
        </Text>
      </Pressable>
    </View>
  );
}

function Avatar({ name, image }: { name: string; image: string | null }) {
  return (
    <View className="w-11 h-11 rounded-full overflow-hidden bg-surface border border-border/60">
      {image ? (
        <Image source={{ uri: image }} style={{ width: 44, height: 44 }} contentFit="cover" />
      ) : (
        <View className="w-11 h-11 items-center justify-center bg-primary/10">
          <Text className="text-primary font-serif-bold text-base">{name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
    </View>
  );
}

function StatusBadge({ isInside }: { isInside: boolean }) {
  return (
    <View
      className={`self-start mt-2 px-2 py-0.5 rounded-full ${isInside ? 'bg-success/10' : 'bg-muted/10'}`}
    >
      <Text className={`text-[10px] font-sans-bold uppercase ${isInside ? 'text-success' : 'text-muted'}`}>
        {isInside ? 'Inside' : 'Outside'}
      </Text>
    </View>
  );
}

function EmptyState({ message, icon }: { message: string; icon: string }) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <View className="items-center justify-center py-16 px-6">
      <Ionicons name={icon as never} size={36} color={theme.muted} />
      <Text className="text-sm font-sans text-muted text-center mt-4 leading-5">{message}</Text>
    </View>
  );
}
