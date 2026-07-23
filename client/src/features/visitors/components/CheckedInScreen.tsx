import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Screen } from '@/components/Screen';
import { DrawerButton } from '@/components/DrawerButton';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLogVisitorExit } from '@/features/visitors/hooks/use-visitors';
import type { VisitorRequest } from '@/features/visitors/services/visitors';

type CheckedInVisitor = VisitorRequest & {
  entryTime?: string;
};

export function CheckedInScreen({ visitors }: { visitors: CheckedInVisitor[] }) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const logExit = useLogVisitorExit();

  const groupedSubtitle = useMemo(() => {
    const count = visitors.length;
    return `${count} visitor${count === 1 ? '' : 's'} currently inside`;
  }, [visitors.length]);

  async function handleLogExit(visitorId: string) {
    try {
      await logExit.mutateAsync(visitorId);
    } catch (error) {
      console.error('Failed to log exit:', error);
    }
  }

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <View className="flex-row items-center justify-between mb-4">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={theme.foreground} />
          </Pressable>
          <Text className="text-lg font-serif-semibold text-foreground">Check-in</Text>
          <DrawerButton />
        </View>

        <Text className="text-xs font-sans text-muted mb-4">{groupedSubtitle}</Text>

        <FlatList
          data={visitors}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 32, gap: 10 }}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Ionicons name="person-outline" size={36} color={theme.muted} />
              <Text className="text-sm font-sans text-muted mt-4">No visitors currently checked in.</Text>
            </View>
          }
          renderItem={({ item }) => <VisitorRow visitor={item} onLogExit={() => handleLogExit(item.id)} isLoading={logExit.isPending} />}
        />
      </View>
    </Screen>
  );
}

function VisitorRow({ visitor, onLogExit, isLoading }: { visitor: CheckedInVisitor; onLogExit: () => void; isLoading: boolean }) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const formatTime = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View className="bg-card border border-border rounded-2xl p-4 gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <TypeBadge type={visitor.visitorType} />
            <View className="px-2 py-0.5 rounded-full bg-success/10">
              <Text className="text-[10px] font-sans-bold text-success uppercase">Inside</Text>
            </View>
          </View>
          <Text className="text-sm font-sans-semibold text-foreground">{visitor.name}</Text>
          {visitor.flat ? (
            <Text className="text-xs font-sans text-muted mt-0.5">Flat {visitor.flat.flatNumber}</Text>
          ) : null}
          {visitor.purpose ? (
            <Text className="text-xs font-sans text-muted mt-0.5">{visitor.purpose}</Text>
          ) : null}
        </View>
        <Text className="text-[10px] font-sans text-muted">Entry: {formatTime(visitor.entryTime)}</Text>
      </View>

      <Pressable
        onPress={onLogExit}
        disabled={isLoading}
        className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 items-center"
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.danger} />
        ) : (
          <Text className="text-sm font-sans-bold text-danger">Log Exit</Text>
        )}
      </Pressable>
    </View>
  );
}

function TypeBadge({ type }: { type: VisitorRequest['visitorType'] }) {
  const styles = {
    guest: 'bg-primary/10',
    delivery: 'bg-warning/10',
    cab: 'bg-info/10',
    service_staff: 'bg-purple/10',
    admin_visitor: 'bg-secondary/10'
  }[type];
  const textStyles = {
    guest: 'text-primary',
    delivery: 'text-warning',
    cab: 'text-info',
    service_staff: 'text-purple',
    admin_visitor: 'text-secondary'
  }[type];

  const labels = {
    guest: 'Guest',
    delivery: 'Delivery',
    cab: 'Cab',
    service_staff: 'Service',
    admin_visitor: 'Admin'
  };

  return (
    <View className={`px-2 py-0.5 rounded-full ${styles}`}>
      <Text className={`text-[10px] font-sans-bold uppercase ${textStyles}`}>
        {labels[type]}
      </Text>
    </View>
  );
}
