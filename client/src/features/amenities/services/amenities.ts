import { apiRequest } from '@/lib/api';

export type BookingStatus = 'confirmed' | 'cancelled';

export type Amenity = {
  id: string;
  societyId: string;
  name: string;
  description: string | null;
  capacity: number | null;
  isActive: boolean;
  createdAt: string;
};

export type AmenityBooking = {
  id: string;
  amenityId: string;
  flatId: string;
  bookedBy: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  amenity?: Pick<Amenity, 'id' | 'name' | 'capacity'> | null;
  flat?: { id: string; flatNumber: string } | null;
  bookedByUser?: { id: string; name: string } | null;
};

export type CreateAmenityInput = {
  name: string;
  description?: string;
  capacity?: number;
};

export type BookAmenityInput = {
  /** ISO-8601 datetime string — must be in the future and before endTime */
  startTime: string;
  /** ISO-8601 datetime string — must be after startTime */
  endTime: string;
};

export async function fetchAmenities() {
  return apiRequest<Amenity[]>('/api/amenities');
}

export async function createAmenity(payload: CreateAmenityInput) {
  return apiRequest<Amenity>('/api/amenities', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchBookings(amenityId?: string) {
  const qs = amenityId ? `?amenityId=${amenityId}` : '';
  return apiRequest<AmenityBooking[]>(`/api/amenities/bookings${qs}`);
}

export async function bookAmenity(amenityId: string, payload: BookAmenityInput) {
  return apiRequest<AmenityBooking>(`/api/amenities/${amenityId}/book`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
