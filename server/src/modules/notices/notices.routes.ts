import type { FastifyInstance } from 'fastify';
import {
  createNotice,
  deleteNotice,
  listNotices,
  updateNotice
} from './notices.controllers';
import { requireAuth, requireRole, requireSociety } from '../../common/middleware/auth.middleware';

export async function noticesRoutes(app: FastifyInstance) {
  app.post(
    '/api/notices',
    { preHandler: [requireAuth, requireSociety, requireRole('society_admin')] },
    createNotice
  );

  // Residents/guards/admins all read the feed — filtering by expiry and
  // includeExpired happens inside the service, based on caller.role.
  app.get('/api/notices', { preHandler: [requireAuth, requireSociety] }, listNotices);

  app.put(
    '/api/notices/:id',
    { preHandler: [requireAuth, requireSociety, requireRole('society_admin')] },
    updateNotice
  );

  app.delete(
    '/api/notices/:id',
    { preHandler: [requireAuth, requireSociety, requireRole('society_admin')] },
    deleteNotice
  );
}
