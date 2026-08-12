import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { ListSkeleton } from '@/components/ui/Skeleton';
import type { VisitorRequest } from '@/features/visitors/services/visitors';

export function VisitorGuardQueue({
  requests,
  isLoading,
  onOpenRegister
}: {
  requests: VisitorRequest[];
  isLoading: boolean;
  onOpenRegister: () => void;
}) {
  const router = useRouter();
  const theme = useTheme();

  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-serif-semibold text-foreground">Pending queue</Text>
        <View className="flex-row items-center gap-2">
          <Button
            label="Verify pass"
            variant="secondary"
            size="sm"
            onPress={() => router.push('/(app)/guard/verify-pass')}
          />
          <Button label="Register" size="sm" onPress={onOpenRegister} />
        </View>
      </View>

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : requests.length === 0 ? (
        <EmptyState
          variant="boxed"
          icon="shield-outline"
          title="Queue is clear"
          subtitle="New guard requests will appear here instantly."
          className="flex-1"
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-8">
          {requests.map((request, index) => (
            <FadeIn key={request.id} index={index}>
              <Card className="p-4 mb-3">
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="text-base font-serif-semibold text-foreground flex-1">
                    {request.name}
                  </Text>
                  <Badge label={request.status} tone="primary" />
                </View>
                <Text className="text-sm font-sans text-foreground-secondary mt-1 capitalize">
                  {request.visitorType.replace('_', ' ')}
                </Text>
                {request.purpose ? (
                  <Text className="text-sm font-sans text-foreground-secondary mt-1.5 leading-5">
                    {request.purpose}
                  </Text>
                ) : null}
                <View className="flex-row items-center gap-4 mt-2.5 pt-2.5 border-t border-border/50">
                  {request.vehicleNumber ? (
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="car-outline" size={12} color={theme.muted} />
                      <Text className="text-xs font-sans text-muted">{request.vehicleNumber}</Text>
                    </View>
                  ) : null}
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="home-outline" size={12} color={theme.muted} />
                    <Text className="text-xs font-sans text-muted">
                      {request.approverType === 'admin'
                        ? 'Routed to admin'
                        : `Flat ${request.flat?.flatNumber ?? '—'}`}
                    </Text>
                  </View>
                </View>
              </Card>
            </FadeIn>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
