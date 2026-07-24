import type { FastifyInstance } from 'fastify';
import {
  createPreApproval,
  createVisitorRequest,
  listCheckedInVisitors,
  listPendingVisitors,
  listPreApprovals,
  logVisitorEntry,
  logVisitorExit,
  registerPushToken,
  respondToVisitorRequest,
  uploadVisitorPhoto,
  verifyPass
} from './visitors.controllers';
import { requireAuth, requireRole, requireSociety } from '../../common/middleware/auth.middleware';

export async function visitorsRoutes(app: FastifyInstance) {
  app.post(
    '/api/visitors/request',
    { preHandler: [requireAuth, requireSociety, requireRole('security_guard')] },
    createVisitorRequest
  );

  app.get(
    '/api/visitors/pending',
    { preHandler: [requireAuth, requireSociety] },
    listPendingVisitors
  );

  app.put(
    '/api/visitors/request/:id/respond',
    { preHandler: [requireAuth, requireSociety, requireRole('resident', 'society_admin')] },
    respondToVisitorRequest
  );

  app.post(
    '/api/visitors/request/:id/log-entry',
    { preHandler: [requireAuth, requireSociety, requireRole('security_guard')] },
    logVisitorEntry
  );

  app.post(
    '/api/visitors/request/:id/log-exit',
    { preHandler: [requireAuth, requireSociety, requireRole('security_guard')] },
    logVisitorExit
  );

  // Generic authenticated upload endpoint — originally guard-only for
  // visitor photos (Chapter 7), opened up to residents in Chapter 12 for
  // complaint photos. Same base64-upload flow either way.
  app.post(
    '/api/upload',
    { preHandler: [requireAuth, requireSociety, requireRole('security_guard', 'resident')] },
    uploadVisitorPhoto
  );

  app.post(
    '/api/notifications/register',
    { preHandler: [requireAuth, requireSociety] },
    registerPushToken
  );

  // ─── Chapter 8 — Pre-Approvals ────────────────────────────────────────────

  app.post(
    '/api/visitors/pre-approve',
    { preHandler: [requireAuth, requireSociety, requireRole('resident')] },
    createPreApproval
  );

  app.get(
    '/api/visitors/pre-approvals',
    { preHandler: [requireAuth, requireSociety, requireRole('resident')] },
    listPreApprovals
  );

  app.post(
    '/api/visitors/verify-pass',
    { preHandler: [requireAuth, requireSociety, requireRole('security_guard')] },
    verifyPass
  );

  app.get(
    '/api/visitors/checked-in',
    { preHandler: [requireAuth, requireSociety, requireRole('security_guard')] },
    listCheckedInVisitors
  );
}
