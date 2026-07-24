import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import {
  bookAmenity,
  createAmenity,
  fetchAmenities,
  fetchBookings,
  type BookAmenityInput,
  type CreateAmenityInput
} from '@/features/amenities/services/amenities';

const AMENITIES_KEY = ['amenities'];
const BOOKINGS_KEY = ['amenities', 'bookings'];

export function useAmenities() {
  return useQuery({ queryKey: AMENITIES_KEY, queryFn: fetchAmenities });
}

export function useCreateAmenity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAmenityInput) => createAmenity(payload),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: AMENITIES_KEY });
    }
  });
}

export function useBookings(amenityId?: string) {
  return useQuery({
    queryKey: amenityId ? [...BOOKINGS_KEY, amenityId] : BOOKINGS_KEY,
    queryFn: () => fetchBookings(amenityId)
  });
}

export function useBookAmenity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ amenityId, payload }: { amenityId: string; payload: BookAmenityInput }) =>
      bookAmenity(amenityId, payload),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Invalidate both the general bookings list and any amenity-specific cache
      queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY });
    }
  });
}
