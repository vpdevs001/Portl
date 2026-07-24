import { useState, useMemo } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Screen } from '@/components/Screen';
import { DrawerButton } from '@/components/DrawerButton';
import {
  useAmenities,
  useBookAmenity,
  useBookings
} from '@/features/amenities/hooks/use-amenities';
import type { Amenity } from '@/features/amenities/services/amenities';

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
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

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
      setError(e instanceof Error ? e.message : 'Booking failed. Please try again.');
    }
  }

  const canConfirm = selectedAmenity !== null && startSlot !== null && endSlot !== null;

  return (
    <Screen>
      <ScrollView className="flex-1 px-6 pt-4" contentContainerClassName="pb-24">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={theme.foreground} />
          </Pressable>
          <Text className="text-lg font-serif-semibold text-foreground">Book an Amenity</Text>
          <DrawerButton />
        </View>

        {/* Amenity picker */}
        <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-3">
          Select Amenity
        </Text>

        {amenitiesLoading ? (
          <View className="items-center py-6">
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : !amenities || amenities.length === 0 ? (
          <View className="bg-card border border-border rounded-2xl p-5 items-center mb-6">
            <Ionicons name="business-outline" size={28} color={theme.muted} />
            <Text className="text-sm font-sans text-muted mt-2 text-center">
              No amenities available yet. Ask your admin to add them.
            </Text>
          </View>
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
                    className="w-10 h-10 rounded-xl items-center justify-center mb-3"
                    style={{ backgroundColor: active ? `${theme.primary}22` : `${theme.muted}22` }}
                  >
                    <Ionicons
                      name="business-outline"
                      size={20}
                      color={active ? theme.primary : theme.muted}
                    />
                  </View>
                  <Text
                    className="text-sm font-serif-semibold leading-5"
                    style={{ color: active ? theme.primary : theme.foreground }}
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
            <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-3">
              Select Date
            </Text>
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
            <Text className="text-xs font-sans-bold text-primary uppercase tracking-wider mb-3">
              Select Time Slot
            </Text>
            {bookingsLoading ? (
              <View className="items-center py-6">
                <ActivityIndicator size="small" color={theme.primary} />
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
            <Pressable
              onPress={handleConfirm}
              disabled={!canConfirm || bookAmenity.isPending}
              className="rounded-xl bg-primary px-4 py-4 items-center mt-6"
              style={{ opacity: canConfirm ? 1 : 0.4 }}
            >
              {bookAmenity.isPending ? (
                <ActivityIndicator size="small" color={theme.primaryForeground} />
              ) : (
                <Text className="text-sm font-sans-bold text-primary-foreground">
                  Confirm Booking
                </Text>
              )}
            </Pressable>
          </>
        ) : null}
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowSuccessModal(false);
          setStartSlot(null);
          setEndSlot(null);
          router.back();
        }}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-card border border-border rounded-3xl p-6 w-full items-center">
            <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center mb-4">
              <Ionicons name="checkmark-circle" size={40} color={theme.primary} />
            </View>
            <Text className="text-xl font-serif-semibold text-foreground text-center mb-2">
              Booking Confirmed!
            </Text>
            <Text className="text-sm font-sans text-muted text-center mb-6 leading-5">
              {selectedAmenity?.name} has been successfully reserved for you.
            </Text>
            <Pressable
              onPress={() => {
                setShowSuccessModal(false);
                setStartSlot(null);
                setEndSlot(null);
                router.back();
              }}
              className="w-full bg-primary py-3.5 rounded-xl items-center"
            >
              <Text className="text-sm font-sans-bold text-primary-foreground">Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
