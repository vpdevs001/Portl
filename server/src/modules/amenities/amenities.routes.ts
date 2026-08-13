import type { FastifyInstance } from 'fastify';
import {
  bookAmenity,
  cancelBooking,
  createAmenity,
  listAmenities,
  listBookings
} from './amenities.controllers';
import { requireAuth, requireRole, requireSociety } from '../../common/middleware/auth.middleware';

export async function amenitiesRoutes(app: FastifyInstance) {
  app.post(
    '/api/amenities',
    { preHandler: [requireAuth, requireSociety, requireRole('society_admin')] },
    createAmenity
  );

  app.get('/api/amenities', { preHandler: [requireAuth, requireSociety] }, listAmenities);

  app.post(
    '/api/amenities/:id/book',
    { preHandler: [requireAuth, requireSociety, requireRole('resident')] },
    bookAmenity
  );

  app.get('/api/amenities/bookings', { preHandler: [requireAuth, requireSociety] }, listBookings);

  // Residents cancel their own flat's bookings; admins cancel any booking in
  // the society — the split is enforced in the service, not the role list.
  app.post(
    '/api/amenities/bookings/:id/cancel',
    { preHandler: [requireAuth, requireSociety, requireRole('resident', 'society_admin')] },
    cancelBooking
  );
}
