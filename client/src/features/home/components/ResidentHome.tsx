import { Screen } from '@/components/Screen';
import {
  usePendingVisitors,
  useRespondToVisitorRequest
} from '@/features/visitors/hooks/use-visitors';
import { VisitorResidentCard } from './VisitorResidentCard';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { HOME_CONSTANTS } from '../constants/home.constants';
import { DrawerButton } from '@/components/DrawerButton';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { useAppSession } from '@/lib/auth-client';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function ResidentHome() {
  const router = useRouter();
  const { data: session } = useAppSession();
  const { data, isLoading } = usePendingVisitors();
  const respond = useRespondToVisitorRequest();

  const firstName = session?.user?.name?.split(' ')[0];

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        {/* Header Bar with Drawer Toggle */}
        <View className="flex-row items-center justify-between pb-4 mb-4 border-b border-border/50">
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

          <Button
            label={HOME_CONSTANTS.RESIDENT.ACTION_TEXT}
            icon="key"
            size="sm"
            onPress={() => router.push('/(app)/pre-approvals')}
          />
        </View>

        <FadeIn className="mb-5">
          <Text className="text-2xl font-serif-bold text-foreground">
            {firstName ? `${greeting()}, ${firstName}` : HOME_CONSTANTS.RESIDENT.TITLE}
          </Text>
          <Text className="text-xs font-sans text-muted mt-1">
            {HOME_CONSTANTS.RESIDENT.DESCRIPTION}
          </Text>
        </FadeIn>

        {isLoading ? (
          <ListSkeleton rows={3} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-20">
            {!data || data.length === 0 ? (
              <EmptyState
                variant="boxed"
                icon="notifications-off-outline"
                title={HOME_CONSTANTS.RESIDENT.EMPTY_TITLE}
                subtitle={HOME_CONSTANTS.RESIDENT.EMPTY_SUBTITLE}
              />
            ) : (
              data.map((request, index) => (
                <FadeIn key={request.id} index={index}>
                  <VisitorResidentCard
                    request={request}
                    onRespond={(id, status) => respond.mutate({ id, status })}
                  />
                </FadeIn>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}
