import { describe, expect, test } from 'bun:test';
import { generatePassCode, PASS_CODE_ALPHABET, PASS_CODE_LENGTH } from './pass-code.ts';

describe('generatePassCode', () => {
  test('returns a 6-character code', () => {
    expect(generatePassCode()).toHaveLength(PASS_CODE_LENGTH);
  });

  test('only uses characters from the unambiguous alphabet', () => {
    const allowed = new Set(PASS_CODE_ALPHABET.split(''));
    for (let i = 0; i < 500; i++) {
      for (const char of generatePassCode()) {
        expect(allowed.has(char)).toBe(true);
      }
    }
  });

  test('never contains ambiguous characters (0/O, 1/I/L)', () => {
    for (let i = 0; i < 500; i++) {
      expect(generatePassCode()).not.toMatch(/[01OIL]/);
    }
  });

  test('produces distinct codes across a large sample', () => {
    const codes = new Set(Array.from({ length: 1000 }, () => generatePassCode()));
    // 32^6 ≈ 1.07B keyspace — 1000 draws should never collide.
    expect(codes.size).toBe(1000);
  });
});
