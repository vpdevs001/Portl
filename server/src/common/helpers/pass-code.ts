import { randomInt } from 'node:crypto';

// Excludes 0/O and 1/I/L — a guard reading this off a resident's phone
// screen at the gate shouldn't have to guess which character it is.
export const PASS_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const PASS_CODE_LENGTH = 6;

/** Generate one random gate pass code (e.g. "K7M4P2"). */
export function generatePassCode(): string {
  let code = '';
  for (let i = 0; i < PASS_CODE_LENGTH; i++) {
    code += PASS_CODE_ALPHABET[randomInt(PASS_CODE_ALPHABET.length)];
  }
  return code;
}
