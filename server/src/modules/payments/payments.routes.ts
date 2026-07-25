import type { FastifyInstance } from 'fastify';
import {
  confirmPayment,
  generateDues,
  listDues,
  listPaymentConfirmations,
  verifyPayment
} from './payments.controllers';
import { requireAuth, requireRole, requireSociety } from '../../common/middleware/auth.middleware';

export async function paymentsRoutes(app: FastifyInstance) {
  app.post(
    '/api/payments/dues',
    { preHandler: [requireAuth, requireSociety, requireRole('society_admin')] },
    generateDues
  );

  // Residents see their own flat's dues; admins see the whole society's —
  // the split happens inside the service based on caller.role, same
  // pattern as complaints/amenities.
  app.get('/api/payments/dues', { preHandler: [requireAuth, requireSociety] }, listDues);

  app.post(
    '/api/payments/confirm',
    { preHandler: [requireAuth, requireSociety, requireRole('resident')] },
    confirmPayment
  );

  // Not in plan.md's endpoint list verbatim, but needed for the admin
  // review screen to have something to list against before approving/
  // rejecting individual confirmations by id.
  app.get(
    '/api/payments/confirmations',
    { preHandler: [requireAuth, requireSociety] },
    listPaymentConfirmations
  );

  app.put(
    '/api/payments/confirm/:id/verify',
    { preHandler: [requireAuth, requireSociety, requireRole('society_admin')] },
    verifyPayment
  );
}
