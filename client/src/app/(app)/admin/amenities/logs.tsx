import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { useAmenities, useBookings } from '@/features/amenities/hooks/use-amenities';
import type { AmenityBooking } from '@/features/amenities/services/amenities';

const STATUS_META: Record<'confirmed' | 'cancelled', { label: string; tone: BadgeTone }> = {
  confirmed: { label: 'Confirmed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'muted' }
};

function formatRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const dateStr = s.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const startTime = s.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const endTime = e.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} · ${startTime} – ${endTime}`;
}

export default function AmenityLogsScreen() {
  const router = useRouter();

  const [amenityFilter, setAmenityFilter] = useState<string | null>(null);

  const { data: amenities } = useAmenities();
  const {
    data: bookings,
    isLoading,
    refetch,
    isRefetching
  } = useBookings(amenityFilter ?? undefined);

  const filtered = bookings ?? [];

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <ScreenHeader
          title="Amenity Bookings"
          showBack
          drawer
          onRefresh={refetch}
          isRefetching={isRefetching}
        />

        <Button
          label="Add new amenity"
          icon="add"
          onPress={() => router.push('/(app)/admin/amenities/create')}
          className="my-2"
        />

        {/* Amenity filter chips */}
        {amenities && amenities.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="my-4"
            contentContainerClassName="gap-2 pr-2"
          >
            <Chip
              label="All"
              selected={amenityFilter === null}
              onPress={() => setAmenityFilter(null)}
            />
            {amenities.map((a) => (
              <Chip
                key={a.id}
                label={a.name}
                selected={amenityFilter === a.id}
                onPress={() => setAmenityFilter(amenityFilter === a.id ? null : a.id)}
              />
            ))}
          </ScrollView>
        ) : (
          <View className="h-4" />
        )}

        {/* Content */}
        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : filtered.length === 0 ? (
          <View className="flex-1 justify-center pb-20">
            <EmptyState
              icon="calendar-outline"
              title="No bookings yet"
              subtitle={
                amenityFilter
                  ? 'No bookings for this amenity.'
                  : 'No bookings have been made yet across the society.'
              }
            />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-20"
            className="mt-1"
          >
            {filtered.map((booking, index) => (
              <FadeIn key={booking.id} index={index}>
                <BookingCard booking={booking} />
              </FadeIn>
            ))}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

function BookingCard({ booking }: { booking: AmenityBooking }) {
  const theme = useTheme();
  const meta = STATUS_META[booking.status];

  return (
    <Card className="p-4 mb-3">
      {/* Top row: amenity name + status badge */}
      <View className="flex-row items-center justify-between mb-2">
        <Text
          className="text-base font-serif-semibold text-foreground flex-1 mr-3"
          numberOfLines={1}
        >
          {booking.amenity?.name ?? 'Amenity'}
        </Text>
        <Badge label={meta.label} tone={meta.tone} />
      </View>

      {/* Date & time range */}
      <View className="flex-row items-center gap-2 mb-3">
        <Ionicons name="time-outline" size={13} color={theme.muted} />
        <Text className="text-xs font-sans text-foreground-secondary flex-1">
          {formatRange(booking.startTime, booking.endTime)}
        </Text>
      </View>

      {/* Divider */}
      <View className="border-t border-border/60 pt-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="person-outline" size={12} color={theme.muted} />
          <Text className="text-[11px] font-sans text-muted">
            {booking.bookedByUser?.name ?? 'Resident'}
          </Text>
        </View>
        {booking.flat?.flatNumber ? (
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="home-outline" size={12} color={theme.muted} />
            <Text className="text-[11px] font-sans text-muted">Flat {booking.flat.flatNumber}</Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}
