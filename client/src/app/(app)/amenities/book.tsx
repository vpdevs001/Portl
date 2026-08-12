import { useState, useMemo } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Spinner } from '@/components/ui/Spinner';
import { getErrorMessage } from '@/lib/errors';
import {
  useAmenities,
  useBookAmenity,
  useBookings,
  useCancelBooking
} from '@/features/amenities/hooks/use-amenities';
import type { Amenity, AmenityBooking } from '@/features/amenities/services/amenities';

// Booking grid: 08:00 – 22:00, 1-hour slots
const SLOT_START_HOUR = 8;
const SLOT_END_HOUR = 22;
const TOTAL_SLOTS = SLOT_END_HOUR - SLOT_START_HOUR; // 14

function padTwo(n: number) {
  return String(n).padStart(2, '0');
}

function slotLabel(hour: number) {
  return `${padTwo(hour)}:00`;
}

/** Returns a Date for a given date-string + hour in local time, as UTC ISO string. */
function slotToISO(dateStr: string, hour: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day, hour, 0, 0, 0);
  return d.toISOString();
}

/** Build the 7-day date strip starting from today. */
function buildDateStrip() {
  const dates: { label: string; short: string; iso: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const iso = `${d.getFullYear()}-${padTwo(d.getMonth() + 1)}-${padTwo(d.getDate())}`;
    dates.push({
      label: i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' }),
      short: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      iso
    });
  }
  return dates;
}

export default function BookAmenityScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [selectedDate, setSelectedDate] = useState(buildDateStrip()[0].iso);
  const [startSlot, setStartSlot] = useState<number | null>(null);
  const [endSlot, setEndSlot] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { data: amenities, isLoading: amenitiesLoading } = useAmenities();
  const { data: bookings, isLoading: bookingsLoading } = useBookings(selectedAmenity?.id);
  const bookAmenity = useBookAmenity();

  const dateStrip = useMemo(() => buildDateStrip(), []);

  /**
   * For the selected date and amenity, compute which 1-hour slots (indexed
   * from 0 = 08:00) are taken by an existing confirmed booking OR have already passed.
   */
  const takenSlots = useMemo<Set<number>>(() => {
    const taken = new Set<number>();
    const now = new Date();

    // Mark past hours for today as taken/disabled
    for (let i = 0; i < TOTAL_SLOTS; i++) {
      const hour = SLOT_START_HOUR + i;
      const slotStartTime = new Date(slotToISO(selectedDate, hour));
      if (slotStartTime <= now) {
        taken.add(i);
      }
    }

    if (!bookings || !selectedDate) return taken;

    for (const b of bookings) {
      if (b.status !== 'confirmed') continue;
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      const bDate = `${bStart.getFullYear()}-${padTwo(bStart.getMonth() + 1)}-${padTwo(bStart.getDate())}`;
      if (bDate !== selectedDate) continue;
      const startH = bStart.getHours();
      const endH = bEnd.getHours();
      for (let h = startH; h < endH; h++) {
        const slotIdx = h - SLOT_START_HOUR;
        if (slotIdx >= 0 && slotIdx < TOTAL_SLOTS) taken.add(slotIdx);
      }
    }
    return taken;
  }, [bookings, selectedDate]);

  function handleSlotPress(slotIdx: number) {
    if (takenSlots.has(slotIdx)) return;

    if (startSlot === null) {
      setStartSlot(slotIdx);
      setEndSlot(slotIdx);
      return;
    }

    if (slotIdx >= startSlot) {
      // Check none of the in-between slots are taken
      for (let i = startSlot; i <= slotIdx; i++) {
        if (takenSlots.has(i)) {
          Alert.alert(
            'Slot unavailable',
            'One or more slots in this range are already booked or in the past.'
          );
          return;
        }
      }
      setEndSlot(slotIdx);
      return;
    }

    // Reset and start fresh selection if clicked earlier slot
    setStartSlot(slotIdx);
    setEndSlot(slotIdx);
  }

  function slotState(slotIdx: number): 'taken' | 'selected' | 'available' {
    if (takenSlots.has(slotIdx)) return 'taken';
    if (startSlot !== null && endSlot !== null && slotIdx >= startSlot && slotIdx <= endSlot)
      return 'selected';
    if (startSlot !== null && slotIdx === startSlot) return 'selected';
    return 'available';
  }

  async function handleConfirm() {
    if (!selectedAmenity || startSlot === null || endSlot === null) {
      setError('Select a start and end slot.');
      return;
    }
    setError(null);

    const startHour = SLOT_START_HOUR + startSlot;
    const endHour = SLOT_START_HOUR + endSlot + 1; // end is exclusive (slot end = next hour start)
    const startTime = slotToISO(selectedDate, startHour);
    const endTime = slotToISO(selectedDate, endHour);

    try {
      await bookAmenity.mutateAsync({
        amenityId: selectedAmenity.id,
        payload: { startTime, endTime }
      });
      setShowSuccessModal(true);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  function handleSuccessDone() {
    setShowSuccessModal(false);
    setStartSlot(null);
    setEndSlot(null);
    router.back();
  }

  const canConfirm = selectedAmenity !== null && startSlot !== null && endSlot !== null;

  return (
    <Screen>
      <ScrollView className="flex-1 px-6 pt-4" contentContainerClassName="pb-24">
        <ScreenHeader title="Book an Amenity" showBack drawer />

        <MyBookingsSection />

        {/* Amenity picker */}
        <SectionLabel className="mb-3">Select Amenity</SectionLabel>

        {amenitiesLoading ? (
          <View className="items-center py-6">
            <Spinner />
          </View>
        ) : !amenities || amenities.length === 0 ? (
          <Card className="p-5 items-center mb-6">
            <Ionicons name="business-outline" size={28} color={theme.muted} />
            <Text className="text-sm font-sans text-muted mt-2 text-center">
              No amenities available yet. Ask your admin to add them.
            </Text>
          </Card>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
            contentContainerClassName="gap-3 pr-2"
          >
            {amenities.map((amenity) => {
              const active = selectedAmenity?.id === amenity.id;
              return (
                <Pressable
                  key={amenity.id}
                  onPress={() => {
                    setSelectedAmenity(amenity);
                    setStartSlot(null);
                    setEndSlot(null);
                  }}
                  className={`rounded-2xl border p-4 w-40 ${
                    active ? 'bg-primary/10 border-primary' : 'bg-card border-border'
                  }`}
                >
                  <View
                    className={`w-10 h-10 rounded-xl items-center justify-center mb-3 ${
                      active ? 'bg-primary/15' : 'bg-surface'
                    }`}
                  >
                    <Ionicons
                      name="business-outline"
                      size={20}
                      color={active ? theme.primary : theme.muted}
                    />
                  </View>
                  <Text
                    className={`text-sm font-serif-semibold leading-5 ${
                      active ? 'text-primary' : 'text-foreground'
                    }`}
                    numberOfLines={2}
                  >
                    {amenity.name}
                  </Text>
                  {amenity.capacity ? (
                    <Text className="text-[11px] font-sans text-muted mt-1">
                      Capacity: {amenity.capacity}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {selectedAmenity ? (
          <>
            {/* Amenity description */}
            {selectedAmenity.description ? (
              <View className="bg-surface rounded-xl px-4 py-3 mb-6">
                <Text className="text-xs font-sans text-foreground-secondary leading-5">
                  {selectedAmenity.description}
                </Text>
              </View>
            ) : null}

            {/* Date strip */}
            <SectionLabel className="mb-3">Select Date</SectionLabel>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-6"
              contentContainerClassName="gap-2 pr-2"
            >
              {dateStrip.map((d) => {
                const active = selectedDate === d.iso;
                return (
                  <Pressable
                    key={d.iso}
                    onPress={() => {
                      setSelectedDate(d.iso);
                      setStartSlot(null);
                      setEndSlot(null);
                    }}
                    className={`rounded-xl border px-3 py-2.5 items-center min-w-[60px] ${
                      active ? 'bg-primary border-primary' : 'bg-card border-border'
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-sans-bold uppercase tracking-wider ${
                        active ? 'text-primary-foreground' : 'text-muted'
                      }`}
                    >
                      {d.label}
                    </Text>
                    <Text
                      className={`text-xs font-sans mt-0.5 ${
                        active ? 'text-primary-foreground' : 'text-foreground-secondary'
                      }`}
                    >
                      {d.short}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Slot grid */}
            <SectionLabel className="mb-3">Select Time Slot</SectionLabel>
            {bookingsLoading ? (
              <View className="items-center py-6">
                <Spinner />
              </View>
            ) : (
              <>
                {/* Legend */}
                <View className="flex-row items-center gap-4 mb-4">
                  <View className="flex-row items-center gap-1.5">
                    <View className="w-3 h-3 rounded-sm bg-primary/20" />
                    <Text className="text-[11px] font-sans text-muted">Available</Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <View className="w-3 h-3 rounded-sm bg-primary" />
                    <Text className="text-[11px] font-sans text-muted">Selected</Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <View className="w-3 h-3 rounded-sm bg-border" />
                    <Text className="text-[11px] font-sans text-muted">Taken</Text>
                  </View>
                </View>

                {/* Selection hint */}
                <Text className="text-[11px] font-sans text-muted mb-3">
                  {startSlot === null
                    ? 'Tap a slot to set your start time.'
                    : endSlot === null
                      ? `Start: ${slotLabel(SLOT_START_HOUR + startSlot)} — now tap the end slot.`
                      : `${slotLabel(SLOT_START_HOUR + startSlot)} – ${slotLabel(SLOT_START_HOUR + endSlot + 1)}`}
                </Text>

                <View className="flex-row flex-wrap gap-2">
                  {Array.from({ length: TOTAL_SLOTS }, (_, i) => i).map((slotIdx) => {
                    const state = slotState(slotIdx);
                    const hour = SLOT_START_HOUR + slotIdx;

                    let bgColor: string = `${theme.primary}20`;
                    let textColor: string = theme.foregroundSecondary;
                    let borderColor: string = `${theme.primary}30`;

                    if (state === 'selected') {
                      bgColor = theme.primary;
                      textColor = theme.primaryForeground;
                      borderColor = theme.primary;
                    } else if (state === 'taken') {
                      bgColor = theme.surface;
                      textColor = theme.muted;
                      borderColor = theme.border;
                    }

                    return (
                      <Pressable
                        key={slotIdx}
                        onPress={() => handleSlotPress(slotIdx)}
                        disabled={state === 'taken'}
                        style={{ backgroundColor: bgColor, borderColor, borderWidth: 1 }}
                        className="rounded-xl px-3 py-2.5 items-center"
                      >
                        <Text style={{ color: textColor }} className="text-xs font-sans-bold">
                          {slotLabel(hour)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {/* Error */}
            {error ? <Text className="text-sm font-sans text-danger mt-4">{error}</Text> : null}

            {/* Confirm button */}
            <Button
              label="Confirm Booking"
              size="lg"
              loading={bookAmenity.isPending}
              disabled={!canConfirm}
              onPress={handleConfirm}
              className="mt-6"
            />
          </>
        ) : null}
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessDone}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <Animated.View
            entering={ZoomIn.duration(350).springify().damping(16)}
            className="bg-card border border-border rounded-3xl p-6 w-full items-center"
          >
            <Animated.View entering={FadeIn.delay(150).duration(300)}>
              <View className="w-16 h-16 rounded-full bg-success/15 items-center justify-center mb-4">
                <Ionicons name="checkmark-circle" size={40} color={theme.success} />
              </View>
            </Animated.View>
            <Text className="text-xl font-serif-semibold text-foreground text-center mb-2">
              Booking Confirmed!
            </Text>
            <Text className="text-sm font-sans text-muted text-center mb-6 leading-5">
              {selectedAmenity?.name} has been successfully reserved for you.
            </Text>
            <Button label="Done" size="lg" onPress={handleSuccessDone} className="w-full" />
          </Animated.View>
        </View>
      </Modal>
    </Screen>
  );
}

function formatBookingRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const dateStr = s.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
  const startTime = s.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const endTime = e.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} · ${startTime} – ${endTime}`;
}

/**
 * The resident's own upcoming confirmed bookings, with a cancel action —
 * closes the loop on the booking lifecycle (the 'cancelled' status existed
 * in the schema but had no path to reach it).
 */
function MyBookingsSection() {
  const theme = useTheme();
  const { data: bookings } = useBookings();
  const cancelBooking = useCancelBooking();
  const [pendingCancel, setPendingCancel] = useState<AmenityBooking | null>(null);
  // Captured once at mount (bookings arrive async after it anyway) — calling
  // Date.now() during render would trip the react-compiler purity rule.
  const [now] = useState(() => Date.now());

  const upcoming = useMemo(() => {
    return (bookings ?? [])
      .filter((b) => b.status === 'confirmed' && new Date(b.endTime).getTime() > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [bookings, now]);

  if (upcoming.length === 0) return null;

  return (
    <View className="mb-6">
      <SectionLabel className="mb-3">My Upcoming Bookings</SectionLabel>
      {upcoming.map((booking) => (
        <Card key={booking.id} className="p-4 mb-2.5 flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
            <Ionicons name="calendar-outline" size={18} color={theme.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-sans-semibold text-foreground" numberOfLines={1}>
              {booking.amenity?.name ?? 'Amenity'}
            </Text>
            <Text className="text-[11px] font-sans text-muted mt-0.5">
              {formatBookingRange(booking.startTime, booking.endTime)}
            </Text>
          </View>
          <Badge label="Confirmed" tone="success" />
          <Pressable
            onPress={() => setPendingCancel(booking)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Cancel booking for ${booking.amenity?.name ?? 'amenity'}`}
            className="w-9 h-9 rounded-lg bg-danger/10 items-center justify-center active:bg-danger/20"
          >
            <Ionicons name="close" size={16} color={theme.danger} />
          </Pressable>
        </Card>
      ))}

      <ConfirmDialog
        visible={!!pendingCancel}
        title="Cancel booking"
        message={`Cancel your booking for ${pendingCancel?.amenity?.name ?? 'this amenity'} on ${
          pendingCancel ? formatBookingRange(pendingCancel.startTime, pendingCancel.endTime) : ''
        }? The slot becomes available to others right away.`}
        confirmLabel="Cancel booking"
        destructive
        onConfirm={() => {
          if (pendingCancel) cancelBooking.mutate(pendingCancel.id);
          setPendingCancel(null);
        }}
        onCancel={() => setPendingCancel(null)}
      />
    </View>
  );
}
