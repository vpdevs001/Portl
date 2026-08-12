import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { usePendingVisitors } from '@/features/visitors/hooks/use-visitors';
import { VisitorGuardQueue } from './VisitorGuardQueue';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';
import { HOME_CONSTANTS } from '../constants/home.constants';
import { DrawerButton } from '@/components/DrawerButton';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { PressableScale } from '@/components/ui/PressableScale';

export function GuardHome() {
  const router = useRouter();
  const { data, isLoading } = usePendingVisitors();

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        {/* Header Bar with Drawer Toggle */}
        <View className="flex-row items-center justify-between pb-4 mb-4 border-b border-border/50">
          <View className="flex-row items-center gap-3">
            <DrawerButton />
            <View>
              <Text className="text-xs font-sans-bold text-primary tracking-wider uppercase">
                {HOME_CONSTANTS.GUARD.APP_TAG}
              </Text>
              <Text className="text-sm font-serif-semibold text-foreground">
                {HOME_CONSTANTS.GUARD.SUBTITLE}
              </Text>
            </View>
          </View>

          <Button
            label={HOME_CONSTANTS.GUARD.ACTION_TEXT}
            icon="person-add"
            size="sm"
            onPress={() => router.push('/(app)/guard/register-visitor')}
          />
        </View>

        <FadeIn className="mb-5">
          <Text className="text-2xl font-serif-bold text-foreground">
            {HOME_CONSTANTS.GUARD.TITLE}
          </Text>
          <Text className="text-xs font-sans text-muted mt-1">
            {HOME_CONSTANTS.GUARD.DESCRIPTION}
          </Text>
        </FadeIn>

        <VisitorGuardQueue
          requests={data ?? []}
          isLoading={isLoading}
          onOpenRegister={() => router.push('/(app)/guard/register-visitor')}
        />

        <FadeIn index={2} className="flex-row gap-3 mt-4">
          <QuickAction
            label="Check-in"
            icon="people-outline"
            onPress={() => router.push('/(app)/guard/resident-search')}
          />
          <QuickAction
            label="Gate logs"
            icon="journal-outline"
            onPress={() => router.push('/(app)/guard/gate-logs')}
          />
          <QuickAction
            label="SOS"
            icon="alert-circle-outline"
            danger
            onPress={() => router.push('/(app)/guard/emergency-alert')}
          />
        </FadeIn>
      </View>
    </Screen>
  );
}

function QuickAction({
  label,
  icon,
  danger = false,
  onPress
}: {
  label: string;
  icon: string;
  danger?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <PressableScale
      onPress={onPress}
      className={`flex-1 rounded-2xl p-4 items-center gap-2 border ${
        danger ? 'bg-danger/10 border-danger/20' : 'bg-card border-border'
      }`}
    >
      <Ionicons name={icon as never} size={20} color={danger ? theme.danger : theme.primary} />
      <Text className={`text-xs font-sans-bold ${danger ? 'text-danger' : 'text-foreground'}`}>
        {label}
      </Text>
    </PressableScale>
  );
}
