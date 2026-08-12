import { Screen } from '@/components/Screen';
import {
  usePendingVisitors,
  useRespondToVisitorRequest
} from '@/features/visitors/hooks/use-visitors';
import { VisitorResidentCard } from './VisitorResidentCard';
import { SocietyMembersSection } from './SocietyMembersSection';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { HOME_CONSTANTS } from '../constants/home.constants';
import { DrawerButton } from '@/components/DrawerButton';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { ListSkeleton } from '@/components/ui/Skeleton';

/**
 * AdminHome — the society_admin Home tab content.
 *
 * Displays pending admin-routed visitor requests and the society member
 * roster, with the global drawer button in the header.
 */
export function AdminHome() {
  const router = useRouter();
  const { data, isLoading } = usePendingVisitors();
  const respond = useRespondToVisitorRequest();

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        {/* Header Bar with Drawer Toggle */}
        <View className="flex-row items-center justify-between pb-4 mb-4 border-b border-border/50">
          <View className="flex-row items-center gap-3">
            <DrawerButton />
            <View>
              <Text className="text-xs font-sans-bold text-primary tracking-wider uppercase">
                {HOME_CONSTANTS.ADMIN.APP_TAG}
              </Text>
              <Text className="text-sm font-serif-semibold text-foreground">
                {HOME_CONSTANTS.ADMIN.SUBTITLE}
              </Text>
            </View>
          </View>

          <Button
            label={HOME_CONSTANTS.ADMIN.ACTION_TEXT}
            icon="person-add"
            size="sm"
            onPress={() => router.push('/(app)/add-resident')}
          />
        </View>

        <FadeIn className="mb-5">
          <Text className="text-2xl font-serif-bold text-foreground">
            {HOME_CONSTANTS.ADMIN.TITLE}
          </Text>
          <Text className="text-xs font-sans text-muted mt-1">
            {HOME_CONSTANTS.ADMIN.DESCRIPTION}
          </Text>
        </FadeIn>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-20">
          <SocietyMembersSection />

          <SectionLabel className="mb-3">Pending Approvals</SectionLabel>

          {isLoading ? (
            <ListSkeleton rows={2} />
          ) : !data || data.length === 0 ? (
            <EmptyState
              variant="boxed"
              icon="shield-checkmark-outline"
              title={HOME_CONSTANTS.ADMIN.EMPTY_TITLE}
              subtitle={HOME_CONSTANTS.ADMIN.EMPTY_SUBTITLE}
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
      </View>
    </Screen>
  );
}
