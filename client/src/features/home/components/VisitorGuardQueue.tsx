import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useColorScheme } from 'react-native';
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
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-serif-semibold text-foreground">Pending queue</Text>
        <Pressable onPress={onOpenRegister} className="rounded-full bg-primary px-3 py-2">
          <Text className="text-xs font-sans-bold text-primary-foreground">Register visitor</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : requests.length === 0 ? (
        <View className="flex-1 items-center justify-center rounded-2xl border border-dashed border-border p-6">
          <Ionicons name="shield-outline" size={28} color={theme.primary} />
          <Text className="text-base font-serif-semibold text-foreground mt-3">Queue is clear</Text>
          <Text className="text-sm font-sans text-foreground-secondary text-center mt-2">
            New guard requests will appear here instantly.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-8">
          {requests.map((request) => (
            <View key={request.id} className="bg-card border border-border rounded-2xl p-4 mb-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-serif-semibold text-foreground">
                  {request.name}
                </Text>
                <View className="rounded-full bg-primary/10 px-2.5 py-1">
                  <Text className="text-[10px] font-sans-bold text-primary uppercase tracking-wider">
                    {request.status}
                  </Text>
                </View>
              </View>
              <Text className="text-sm font-sans text-foreground-secondary mt-1">
                {request.visitorType.replace('_', ' ')}
              </Text>
              {request.purpose ? (
                <Text className="text-sm font-sans text-foreground-secondary mt-2">
                  {request.purpose}
                </Text>
              ) : null}
              {request.vehicleNumber ? (
                <Text className="text-sm font-sans text-foreground-secondary mt-1">
                  Vehicle: {request.vehicleNumber}
                </Text>
              ) : null}
              <Text className="text-sm font-sans text-foreground-secondary mt-1">
                {request.approverType === 'admin'
                  ? 'Routed to admin'
                  : `Flat ${request.flat?.flatNumber ?? request.flat?.number ?? request.flat?.name ?? '—'}`}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
