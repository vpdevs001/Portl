import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Colors } from '@/constants/colors';
import { Screen } from '@/components/Screen';
import { usePendingVisitors } from '@/features/visitors/hooks/use-visitors';
import { VisitorGuardQueue } from '@/features/home/components/VisitorGuardQueue';
import { DrawerButton } from '@/components/DrawerButton';

export function VisitorQueueScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { data, isLoading, refetch, isRefetching } = usePendingVisitors();

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <View className="flex-row items-center justify-between mb-2">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={theme.foreground} />
          </Pressable>
          <Text className="text-lg font-serif-semibold text-foreground">Visitor queue</Text>
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

        <VisitorGuardQueue
          requests={data ?? []}
          isLoading={isLoading}
          onOpenRegister={() => router.push('/(app)/guard/register-visitor')}
        />
      </View>
    </Screen>
  );
}
