import type { FastifyInstance } from 'fastify';
import {
  createVisitorRequest,
  listPendingVisitors,
  logVisitorEntry,
  logVisitorExit,
  registerPushToken,
  respondToVisitorRequest,
  uploadVisitorPhoto
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

  app.post(
    '/api/upload',
    { preHandler: [requireAuth, requireSociety, requireRole('security_guard')] },
    uploadVisitorPhoto
  );

  app.post(
    '/api/notifications/register',
    { preHandler: [requireAuth, requireSociety] },
    registerPushToken
  );
}
