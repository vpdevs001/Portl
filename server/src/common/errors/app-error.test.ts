import { describe, expect, test } from 'bun:test';
import { AppError } from './app-error.ts';
import { ERROR_CODES } from './error-codes.ts';

describe('AppError', () => {
  test('carries statusCode, code, message and details', () => {
    const err = new AppError(418, 'CONFLICT', 'teapot', { a: 1 });
    expect(err.statusCode).toBe(418);
    expect(err.code).toBe('CONFLICT');
    expect(err.message).toBe('teapot');
    expect(err.details).toEqual({ a: 1 });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });

  test('factories map to the right HTTP status and code', () => {
    expect(AppError.notFound('x').statusCode).toBe(404);
    expect(AppError.notFound('x').code).toBe(ERROR_CODES.NOT_FOUND);

    expect(AppError.badRequest('x').statusCode).toBe(400);
    expect(AppError.badRequest('x').code).toBe(ERROR_CODES.BAD_REQUEST);

    expect(AppError.conflict('x').statusCode).toBe(409);
    expect(AppError.conflict('x').code).toBe(ERROR_CODES.CONFLICT);

    expect(AppError.unauthorized('x').statusCode).toBe(401);
    expect(AppError.unauthorized('x').code).toBe(ERROR_CODES.UNAUTHORIZED);

    expect(AppError.forbidden('x').statusCode).toBe(403);
    expect(AppError.forbidden('x').code).toBe(ERROR_CODES.FORBIDDEN);
  });

  test('prototype chain survives (instanceof works after throw/catch)', () => {
    try {
      throw AppError.notFound('missing');
    } catch (err) {
      expect(err instanceof AppError).toBe(true);
      expect((err as AppError).statusCode).toBe(404);
    }
  });
});
