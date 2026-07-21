import { Pressable, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { VisitorRequest } from '@/features/visitors/services/visitors';

export function VisitorResidentCard({
  request,
  onRespond
}: {
  request: VisitorRequest;
  onRespond: (id: string, status: 'approved' | 'rejected') => void;
}) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <View className="bg-card border border-border rounded-2xl p-4 mb-3">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-base font-serif-semibold text-foreground">{request.name}</Text>
          <Text className="text-xs font-sans text-muted mt-1">{request.visitorType}</Text>
          {request.purpose ? (
            <Text className="text-sm font-sans text-foreground-secondary mt-2">
              {request.purpose}
            </Text>
          ) : null}
          {request.deliveryDetails?.companyName ? (
            <Text className="text-sm font-sans text-foreground-secondary">
              Delivery from {request.deliveryDetails.companyName}
            </Text>
          ) : null}
          {request.cabDetails?.providerName ? (
            <Text className="text-sm font-sans text-foreground-secondary">
              Cab via {request.cabDetails.providerName}
            </Text>
          ) : null}
          {request.serviceStaffDetails?.serviceType ? (
            <Text className="text-sm font-sans text-foreground-secondary">
              {request.serviceStaffDetails.serviceType}
            </Text>
          ) : null}
        </View>
        <View className="rounded-full bg-primary/10 p-2 ml-2">
          <Ionicons name="person-circle-outline" size={24} color={theme.primary} />
        </View>
      </View>

      <View className="flex-row gap-2 mt-4">
        <Pressable
          onPress={() => onRespond(request.id, 'approved')}
          className="flex-1 rounded-xl bg-primary px-3 py-3 items-center"
        >
          <Text className="text-sm font-sans-bold text-primary-foreground">Approve</Text>
        </Pressable>
        <Pressable
          onPress={() => onRespond(request.id, 'rejected')}
          className="flex-1 rounded-xl border border-border px-3 py-3 items-center"
        >
          <Text className="text-sm font-sans text-foreground">Reject</Text>
        </Pressable>
      </View>
    </View>
  );
}
