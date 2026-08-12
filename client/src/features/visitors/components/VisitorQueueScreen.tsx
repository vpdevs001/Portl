import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { usePendingVisitors } from '@/features/visitors/hooks/use-visitors';
import { VisitorGuardQueue } from '@/features/home/components/VisitorGuardQueue';

export function VisitorQueueScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = usePendingVisitors();

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <ScreenHeader
          title="Visitor queue"
          showBack
          drawer
          onRefresh={refetch}
          isRefetching={isRefetching}
        />

        <VisitorGuardQueue
          requests={data ?? []}
          isLoading={isLoading}
          onOpenRegister={() => router.push('/(app)/guard/register-visitor')}
        />
      </View>
    </Screen>
  );
}
