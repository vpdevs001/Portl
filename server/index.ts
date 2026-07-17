import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

import dbPlugin from './src/common/plugins/db.plugin.ts';
import errorHandlerPlugin from './src/common/plugins/error-handler.plugin.ts';
import { sendError } from './src/common/http/app-response.ts';
import { ERROR_CODES } from './src/common/errors/error-codes.ts';
import { AppError } from './src/common/errors/app-error.ts';
import { healthRoutes } from './src/modules/health/health.routes.ts';
import { authRoutes } from './src/modules/auth/auth.routes.ts';
import env from './env.ts';

async function buildServer() {
  // ── Logging: pino-pretty in dev, structured JSON in production ─────────────
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        env.NODE_ENV === 'production'
          ? undefined
          : {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss',
                ignore: 'pid,hostname'
              }
            }
    }
  });

  // ── Zod type provider (must be before any route that uses Zod schemas) ──────
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // ── Security headers (CSP disabled — pure JSON API, not a browser app) ──────
  await app.register(helmet, { contentSecurityPolicy: false });

  // ── CORS ─────────────────────────────────────────────────────────────────────
  const corsOrigins = process.env.CORS_?.split(',').map((origin) => origin.trim());
  await app.register(cors, {
    origin: corsOrigins?.length ? corsOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  });

  // ── Global error handler (register before routes so it covers everything) ───
  await app.register(errorHandlerPlugin);

  // ── Database ─────────────────────────────────────────────────────────────────
  await app.register(dbPlugin);

  // ── Not Found handler ─────────────────────────────────────────────────────────
  // Case 5a: routing-layer 404 — no path/method combination is registered.
  // Uses code ROUTE_NOT_FOUND (distinct from NOT_FOUND which is a business-logic
  // 404 thrown by route handlers via AppError.notFound).
  app.setNotFoundHandler((request, reply) => {
    sendError(
      reply,
      404,
      ERROR_CODES.ROUTE_NOT_FOUND,
      `Route ${request.method} ${request.url} not found`
    );
  });

  // ── Routes ────────────────────────────────────────────────────────────────────
  await app.register(healthRoutes);
  await app.register(authRoutes);

  // TEMPORARY — verify AppError.notFound shape; remove after confirming.
  // Case 5b: business-logic 404 — route exists but resource lookup failed.
  app.get('/test-not-found', async () => {
    throw AppError.notFound('Test: resource not found');
  });

  return app;
}

async function start() {
  const app = await buildServer();
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
