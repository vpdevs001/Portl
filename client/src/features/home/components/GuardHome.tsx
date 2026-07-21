import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { usePendingVisitors } from '@/features/visitors/hooks/use-visitors';
import { VisitorGuardQueue } from './VisitorGuardQueue';

export function GuardHome() {
  const router = useRouter();
  const { data, isLoading } = usePendingVisitors();

  return (
    <Screen>
      <View className="flex-1 px-6 pt-8">
        <View className="mb-6">
          <Text className="text-2xl font-serif-bold text-foreground">Guard Home</Text>
          <Text className="text-xs font-sans text-muted mt-1">
            Gate management &amp; visitor queue
          </Text>
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
