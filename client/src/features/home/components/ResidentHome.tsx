import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
import {
  usePendingVisitors,
  useRespondToVisitorRequest
} from '@/features/visitors/hooks/use-visitors';
import { VisitorResidentCard } from './VisitorResidentCard';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { HOME_CONSTANTS } from '../constants/home.constants';
import { DrawerButton } from '@/components/DrawerButton';

export function ResidentHome() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { data, isLoading } = usePendingVisitors();
  const respond = useRespondToVisitorRequest();

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        {/* Header Bar with Drawer Toggle */}
        <View className="flex-row items-center justify-between pb-4 mb-2 border-b border-border/50">
          <View className="flex-row items-center gap-3">
            <DrawerButton />
            <View>
              <Text className="text-xs font-sans-bold text-primary tracking-wider uppercase">
                {HOME_CONSTANTS.RESIDENT.APP_TAG}
              </Text>
              <Text className="text-sm font-serif-semibold text-foreground">
                {HOME_CONSTANTS.RESIDENT.SUBTITLE}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => router.push('/(app)/guard/pre-approval' as any)}
            className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-primary active:opacity-90"
          >
            <Ionicons name="key" size={14} color={theme.primaryForeground} />
            <Text className="text-xs font-sans-bold text-primary-foreground">
              {HOME_CONSTANTS.RESIDENT.ACTION_TEXT}
            </Text>
          </Pressable>
        </View>

        <View className="mb-6">
          <Text className="text-2xl font-serif-bold text-foreground">
            {HOME_CONSTANTS.RESIDENT.TITLE}
          </Text>
          <Text className="text-xs font-sans text-muted mt-1">
            {HOME_CONSTANTS.RESIDENT.DESCRIPTION}
          </Text>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-20">
            {!data || data.length === 0 ? (
              <View className="flex-1 items-center justify-center rounded-2xl border border-dashed border-border p-6 min-h-[200px]">
                <Ionicons name="notifications-off-outline" size={28} color={theme.muted} />
                <Text className="text-base font-serif-semibold text-foreground mt-3">
                  {HOME_CONSTANTS.RESIDENT.EMPTY_TITLE}
                </Text>
                <Text className="text-sm font-sans text-foreground-secondary text-center mt-2">
                  {HOME_CONSTANTS.RESIDENT.EMPTY_SUBTITLE}
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
