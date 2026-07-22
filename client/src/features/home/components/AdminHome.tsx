import { useState } from 'react';
import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import {
  usePendingVisitors,
  useRespondToVisitorRequest
} from '@/features/visitors/hooks/use-visitors';
import { VisitorResidentCard } from './VisitorResidentCard';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { RoleDrawer } from '@/components/RoleDrawer';
import { useRouter } from 'expo-router';
import { HOME_CONSTANTS } from '../constants/home.constants';

/**
 * AdminHome — the society_admin Home tab content.
 *
 * Displays pending admin-routed visitor requests and includes the role-based
 * drawer navigator trigger in the header.
 */
export function AdminHome() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { data, isLoading } = usePendingVisitors();
  const respond = useRespondToVisitorRequest();

  const [drawerVisible, setDrawerVisible] = useState(false);

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        {/* Header Bar with Drawer Toggle */}
        <View className="flex-row items-center justify-between pb-4 mb-2 border-b border-border/50">
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => setDrawerVisible(true)}
              className="w-10 h-10 rounded-xl bg-card border border-border items-center justify-center active:bg-surface"
            >
              <Ionicons name="menu" size={22} color={theme.foreground} />
            </Pressable>
            <View>
              <Text className="text-xs font-sans-bold text-primary tracking-wider uppercase">
                {HOME_CONSTANTS.ADMIN.APP_TAG}
              </Text>
              <Text className="text-sm font-serif-semibold text-foreground">
                {HOME_CONSTANTS.ADMIN.SUBTITLE}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => router.push('/(app)/add-resident' as any)}
            className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-primary active:opacity-90"
          >
            <Ionicons name="person-add" size={14} color={theme.primaryForeground} />
            <Text className="text-xs font-sans-bold text-primary-foreground">
              {HOME_CONSTANTS.ADMIN.ACTION_TEXT}
            </Text>
          </Pressable>
        </View>

        {/* Dashboard Banner */}
        <View className="mb-6">
          <Text className="text-2xl font-serif-bold text-foreground">
            {HOME_CONSTANTS.ADMIN.TITLE}
          </Text>
          <Text className="text-xs font-sans text-muted mt-1">
            {HOME_CONSTANTS.ADMIN.DESCRIPTION}
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
                <Ionicons name="shield-checkmark-outline" size={28} color={theme.primary} />
                <Text className="text-base font-serif-semibold text-foreground mt-3">
                  {HOME_CONSTANTS.ADMIN.EMPTY_TITLE}
                </Text>
                <Text className="text-sm font-sans text-foreground-secondary text-center mt-2 px-4">
                  {HOME_CONSTANTS.ADMIN.EMPTY_SUBTITLE}
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

      {/* Role Drawer Overlay */}
      <RoleDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </Screen>
  );
}
