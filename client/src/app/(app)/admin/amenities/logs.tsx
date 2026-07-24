import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { DrawerButton } from '@/components/DrawerButton';
import { useAmenities, useBookings } from '@/features/amenities/hooks/use-amenities';
import type { AmenityBooking } from '@/features/amenities/services/amenities';

type StatusToken = 'success' | 'muted';

const STATUS_META: Record<'confirmed' | 'cancelled', { label: string; token: StatusToken }> = {
  confirmed: { label: 'Confirmed', token: 'success' },
  cancelled: { label: 'Cancelled', token: 'muted' }
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
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

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
        {/* Header */}
        <View className="flex-row items-center justify-between mb-2">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={theme.foreground} />
          </Pressable>
          <Text className="text-lg font-serif-semibold text-foreground">Amenity Bookings</Text>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => refetch()}
              hitSlop={12}
              className="w-10 h-10 rounded-xl bg-card border border-border items-center justify-center"
            >
              <Ionicons
                name="refresh"
                size={18}
                color={theme.foreground}
                style={isRefetching ? { opacity: 0.4 } : undefined}
              />
            </Pressable>
            <DrawerButton />
          </View>
        </View>

        {/* Add Amenity action button */}
        <Pressable
          onPress={() => router.push('/(app)/admin/amenities/create')}
          className="flex-row items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 my-2"
        >
          <Ionicons name="add" size={18} color={theme.primaryForeground} />
          <Text className="text-sm font-sans-bold text-primary-foreground">Add new amenity</Text>
        </Pressable>

        {/* Amenity filter chips */}
        {amenities && amenities.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="my-4"
            contentContainerClassName="gap-2 pr-2"
          >
            <Pressable
              onPress={() => setAmenityFilter(null)}
              className={`px-4 py-2 rounded-full border mr-1 ${
                amenityFilter === null ? 'bg-primary border-primary' : 'bg-card border-border'
              }`}
            >
              <Text
                className={`text-xs font-sans-bold ${
                  amenityFilter === null ? 'text-primary-foreground' : 'text-foreground-secondary'
                }`}
              >
                All
              </Text>
            </Pressable>
            {amenities.map((a) => {
              const active = amenityFilter === a.id;
              return (
                <Pressable
                  key={a.id}
                  onPress={() => setAmenityFilter(active ? null : a.id)}
                  className={`px-4 py-2 rounded-full border mr-1 ${
                    active ? 'bg-primary border-primary' : 'bg-card border-border'
                  }`}
                >
                  <Text
                    className={`text-xs font-sans-bold ${
                      active ? 'text-primary-foreground' : 'text-foreground-secondary'
                    }`}
                  >
                    {a.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <View className="h-4" />
        )}

        {/* Content */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : filtered.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-3 pb-20">
            <View className="w-14 h-14 rounded-full border border-primary/30 bg-card items-center justify-center mb-2">
              <Ionicons name="calendar-outline" size={24} color={theme.primary} />
            </View>
            <Text className="text-base font-serif-semibold text-foreground text-center">
              No bookings yet
            </Text>
            <Text className="text-sm font-sans text-foreground-secondary text-center leading-6 px-6">
              {amenityFilter
                ? 'No bookings for this amenity.'
                : 'No bookings have been made yet across the society.'}
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-20"
            className="mt-1"
          >
            {filtered.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

function BookingCard({ booking }: { booking: AmenityBooking }) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const meta = STATUS_META[booking.status];
  const badgeColor = theme[meta.token];

  return (
    <View className="bg-card border border-border rounded-2xl p-4 mb-3">
      {/* Top row: amenity name + status badge */}
      <View className="flex-row items-center justify-between mb-2">
        <Text
          className="text-base font-serif-semibold text-foreground flex-1 mr-3"
          numberOfLines={1}
        >
          {booking.amenity?.name ?? 'Amenity'}
        </Text>
        <View
          className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ backgroundColor: `${badgeColor}1a` }}
        >
          <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: badgeColor }} />
          <Text
            className="text-[10px] font-sans-bold uppercase tracking-wider"
            style={{ color: badgeColor }}
          >
            {meta.label}
          </Text>
        </View>
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
    </View>
  );
}
