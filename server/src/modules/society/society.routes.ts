import type { FastifyInstance } from 'fastify';
import {
  createSociety,
  getSocietyDetailsMe,
  createTower,
  listTowers,
  createFlat,
  listFlats,
  listMembers
} from './society.controllers';
import { requireAuth, requireRole, requireSociety } from '../../common/middleware/auth.middleware';

export async function societyRoutes(app: FastifyInstance) {
  // Societies
  app.post('/api/societies', { preHandler: [requireAuth] }, createSociety);
  app.get('/api/societies/me', { preHandler: [requireAuth, requireSociety] }, getSocietyDetailsMe);

  // Towers
  app.post(
    '/api/societies/towers',
    { preHandler: [requireAuth, requireSociety, requireRole('society_admin')] },
    createTower
  );
  app.get('/api/societies/towers', { preHandler: [requireAuth, requireSociety] }, listTowers);

  // Flats
  app.post(
    '/api/societies/flats',
    { preHandler: [requireAuth, requireSociety, requireRole('society_admin')] },
    createFlat
  );
  app.get('/api/societies/flats', { preHandler: [requireAuth, requireSociety] }, listFlats);

  // Members
  app.get('/api/societies/members', { preHandler: [requireAuth, requireSociety] }, listMembers);
}
