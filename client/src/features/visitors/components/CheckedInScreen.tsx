import { useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { useLogVisitorExit } from '@/features/visitors/hooks/use-visitors';
import type { VisitorRequest } from '@/features/visitors/services/visitors';

type CheckedInVisitor = VisitorRequest & {
  entryTime?: string;
};

export function CheckedInScreen({ visitors }: { visitors: CheckedInVisitor[] }) {
  const logExit = useLogVisitorExit();

  const groupedSubtitle = useMemo(() => {
    const count = visitors.length;
    return `${count} visitor${count === 1 ? '' : 's'} currently inside`;
  }, [visitors.length]);

  async function handleLogExit(visitorId: string) {
    try {
      await logExit.mutateAsync(visitorId);
    } catch (error) {
      console.error('Failed to log exit:', error);
    }
  }

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <ScreenHeader title="Check-in" subtitle={groupedSubtitle} showBack drawer />

        <FlatList
          data={visitors}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 32, gap: 10 }}
          ListEmptyComponent={
            <EmptyState
              icon="person-outline"
              title="All clear"
              subtitle="No visitors currently checked in."
            />
          }
          renderItem={({ item, index }) => (
            <FadeIn index={index}>
              <VisitorRow
                visitor={item}
                onLogExit={() => handleLogExit(item.id)}
                isLoading={logExit.isPending}
              />
            </FadeIn>
          )}
        />
      </View>
    </Screen>
  );
}

function VisitorRow({
  visitor,
  onLogExit,
  isLoading
}: {
  visitor: CheckedInVisitor;
  onLogExit: () => void;
  isLoading: boolean;
}) {
  const formatTime = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="p-4 gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1.5">
            <TypeBadge type={visitor.visitorType} />
            <Badge label="Inside" tone="success" />
          </View>
          <Text className="text-sm font-sans-semibold text-foreground">{visitor.name}</Text>
          {visitor.flat ? (
            <Text className="text-xs font-sans text-muted mt-0.5">
              Flat {visitor.flat.flatNumber}
            </Text>
          ) : null}
          {visitor.purpose ? (
            <Text className="text-xs font-sans text-muted mt-0.5">{visitor.purpose}</Text>
          ) : null}
        </View>
        <Text className="text-[10px] font-sans text-muted">
          Entry: {formatTime(visitor.entryTime)}
        </Text>
      </View>

      <Button
        label="Log Exit"
        variant="dangerSoft"
        size="sm"
        loading={isLoading}
        onPress={onLogExit}
      />
    </Card>
  );
}

// Fixed: the old map referenced theme tokens that don't exist (info, purple,
// secondary), so cab/service/admin badges silently rendered unstyled.
function TypeBadge({ type }: { type: VisitorRequest['visitorType'] }) {
  const meta: Record<VisitorRequest['visitorType'], { label: string; tone: BadgeTone }> = {
    guest: { label: 'Guest', tone: 'primary' },
    delivery: { label: 'Delivery', tone: 'warning' },
    cab: { label: 'Cab', tone: 'info' },
    service_staff: { label: 'Service', tone: 'muted' },
    admin_visitor: { label: 'Admin', tone: 'primary' }
  };

  return <Badge label={meta[type].label} tone={meta[type].tone} />;
}
