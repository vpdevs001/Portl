import type { FastifyInstance } from 'fastify';
import { getSession, handleAuthRequest } from './auth.controllers';

export async function authRoutes(app: FastifyInstance) {
  // Better Auth's catch-all: covers sign-up, sign-in (email + social), the
  // OAuth callback for each provider (/api/auth/callback/:provider),
  // sign-out, email verification, and every other Better Auth endpoint.
  // See auth.controller.ts for why this must stay a single wildcard route.
  app.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    handler: handleAuthRequest
  });

  // Explicit session route, returned via the app's standard response
  // envelope instead of Better Auth's raw response shape.
  app.get('/api/auth/session', getSession);
}
