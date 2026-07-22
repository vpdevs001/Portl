import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { usePendingVisitors } from '@/features/visitors/hooks/use-visitors';
import { VisitorGuardQueue } from './VisitorGuardQueue';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/colors';
import { RoleDrawer } from '@/components/RoleDrawer';
import { HOME_CONSTANTS } from '../constants/home.constants';

export function GuardHome() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { data, isLoading } = usePendingVisitors();

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
                {HOME_CONSTANTS.GUARD.APP_TAG}
              </Text>
              <Text className="text-sm font-serif-semibold text-foreground">
                {HOME_CONSTANTS.GUARD.SUBTITLE}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => router.push('/(app)/guard/register-visitor' as any)}
            className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-primary active:opacity-90"
          >
            <Ionicons name="person-add" size={14} color={theme.primaryForeground} />
            <Text className="text-xs font-sans-bold text-primary-foreground">
              {HOME_CONSTANTS.GUARD.ACTION_TEXT}
            </Text>
          </Pressable>
        </View>

        <View className="mb-6">
          <Text className="text-2xl font-serif-bold text-foreground">
            {HOME_CONSTANTS.GUARD.TITLE}
          </Text>
          <Text className="text-xs font-sans text-muted mt-1">
            {HOME_CONSTANTS.GUARD.DESCRIPTION}
          </Text>
        </View>

        <VisitorGuardQueue
          requests={data ?? []}
          isLoading={isLoading}
          onOpenRegister={() => router.push('/(app)/guard/register-visitor')}
        />
      </View>

      {/* Role Drawer Overlay */}
      <RoleDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </Screen>
  );
}
