import { Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';
import { Card } from '@/components/ui/Card';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { VisitorRequest } from '@/features/visitors/services/visitors';

const TYPE_META: Record<string, { label: string; icon: string; tone: BadgeTone }> = {
  guest: { label: 'Guest', icon: 'person-outline', tone: 'primary' },
  delivery: { label: 'Delivery', icon: 'bicycle-outline', tone: 'warning' },
  cab: { label: 'Cab', icon: 'car-outline', tone: 'info' },
  service_staff: { label: 'Service', icon: 'construct-outline', tone: 'muted' },
  admin_visitor: { label: 'Admin', icon: 'business-outline', tone: 'primary' }
};

export function VisitorResidentCard({
  request,
  onRespond
}: {
  request: VisitorRequest;
  onRespond: (id: string, status: 'approved' | 'rejected') => void;
}) {
  const theme = useTheme();
  const meta = TYPE_META[request.visitorType] ?? TYPE_META.guest;

  const detailLine = request.deliveryDetails?.companyName
    ? `Delivery from ${request.deliveryDetails.companyName}`
    : request.cabDetails?.providerName
      ? `Cab via ${request.cabDetails.providerName}`
      : (request.serviceStaffDetails?.serviceType ?? null);

  return (
    <Card className="p-4 mb-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1.5">
            <Badge label={meta.label} icon={meta.icon} tone={meta.tone} />
          </View>
          <Text className="text-base font-serif-semibold text-foreground">{request.name}</Text>
          {request.purpose ? (
            <Text className="text-sm font-sans text-foreground-secondary mt-1 leading-5">
              {request.purpose}
            </Text>
          ) : null}
          {detailLine ? (
            <Text className="text-xs font-sans text-muted mt-1">{detailLine}</Text>
          ) : null}
        </View>
        <View className="w-11 h-11 rounded-full bg-primary/10 border border-primary/15 items-center justify-center">
          <Ionicons name={meta.icon as never} size={20} color={theme.primary} />
        </View>
      </View>

      <View className="flex-row gap-2.5 mt-4">
        <Button
          label="Approve"
          icon="checkmark"
          size="sm"
          className="flex-1 py-3"
          onPress={() => onRespond(request.id, 'approved')}
        />
        <Button
          label="Reject"
          icon="close"
          variant="secondary"
          size="sm"
          className="flex-1 py-3"
          onPress={() => onRespond(request.id, 'rejected')}
        />
      </View>
    </Card>
  );
}
