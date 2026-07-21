import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
import {
  usePendingVisitors,
  useRespondToVisitorRequest
} from '@/features/visitors/hooks/use-visitors';
import { VisitorResidentCard } from './VisitorResidentCard';
import { ActivityIndicator, ScrollView, Text, View, useColorScheme } from 'react-native';

export function ResidentHome() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { data, isLoading } = usePendingVisitors();
  const respond = useRespondToVisitorRequest();

  return (
    <Screen>
      <View className="flex-1 px-6 pt-8">
        <View className="mb-6">
          <Text className="text-2xl font-serif-bold text-foreground">Home</Text>
          <Text className="text-xs font-sans text-muted mt-1">
            Your gate &amp; visitor activity
          </Text>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-20">
            {!data || data.length === 0 ? (
              <View className="flex-1 items-center justify-center rounded-2xl border border-dashed border-border p-6 min-h-[220px]">
                <Text className="text-base font-serif-semibold text-foreground">
                  No pending visitors
                </Text>
                <Text className="text-sm font-sans text-foreground-secondary text-center mt-2">
                  Incoming requests from the gate will appear here.
                </Text>
              </View>
            ) : (
              data.map((request) => (
                <VisitorResidentCard
                  key={request.id}
                  request={request}
                  onRespond={(id, status) => respond.mutate({ id, status })}
                />
              ))
            )}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}
