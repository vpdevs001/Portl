import { describe, expect, test } from 'bun:test';
import { bookAmenitySchema, createAmenitySchema } from './amenities.schema.ts';

function futureISO(minutesFromNow: number) {
  return new Date(Date.now() + minutesFromNow * 60_000).toISOString();
}

describe('bookAmenitySchema', () => {
  test('accepts a valid future window', () => {
    const parsed = bookAmenitySchema.parse({
      startTime: futureISO(60),
      endTime: futureISO(120)
    });
    expect(parsed.startTime).toBeTruthy();
    expect(parsed.endTime).toBeTruthy();
  });

  test('rejects endTime before startTime', () => {
    expect(() =>
      bookAmenitySchema.parse({ startTime: futureISO(120), endTime: futureISO(60) })
    ).toThrow();
  });

  test('rejects a startTime in the past', () => {
    expect(() =>
      bookAmenitySchema.parse({ startTime: futureISO(-60), endTime: futureISO(60) })
    ).toThrow();
  });

  test('rejects malformed datetimes', () => {
    expect(() =>
      bookAmenitySchema.parse({ startTime: 'tomorrow', endTime: futureISO(60) })
    ).toThrow();
    expect(() => bookAmenitySchema.parse({ startTime: futureISO(60), endTime: '' })).toThrow();
  });
});

describe('createAmenitySchema', () => {
  test('accepts a minimal valid payload', () => {
    const parsed = createAmenitySchema.parse({ name: 'Clubhouse' });
    expect(parsed.name).toBe('Clubhouse');
    expect(parsed.description).toBeUndefined();
    expect(parsed.capacity).toBeUndefined();
  });

  test('trims and validates the name', () => {
    expect(createAmenitySchema.parse({ name: '  Pool  ' }).name).toBe('Pool');
    expect(() => createAmenitySchema.parse({ name: '' })).toThrow();
    expect(() => createAmenitySchema.parse({ name: '   ' })).toThrow();
  });

  test('turns an empty-string description into undefined', () => {
    expect(createAmenitySchema.parse({ name: 'Gym', description: '' }).description).toBeUndefined();
  });

  test('coerces numeric capacity and rejects non-positive values', () => {
    expect(createAmenitySchema.parse({ name: 'Gym', capacity: '25' }).capacity).toBe(25);
    expect(() => createAmenitySchema.parse({ name: 'Gym', capacity: 0 })).toThrow();
    expect(() => createAmenitySchema.parse({ name: 'Gym', capacity: -3 })).toThrow();
  });
});
