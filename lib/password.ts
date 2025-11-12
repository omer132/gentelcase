import crypto from 'crypto';

const DEFAULT_ITERATIONS = 100_000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto
    .pbkdf2Sync(password, salt, DEFAULT_ITERATIONS, KEY_LENGTH, DIGEST)
    .toString('hex');
  return `${DEFAULT_ITERATIONS}:${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;

  const parts = storedHash.split(':');
  if (parts.length !== 3) return false;

  const [iterationPart, salt, expectedKey] = parts;
  const iterations = Number.parseInt(iterationPart, 10);
  if (!Number.isFinite(iterations) || iterations <= 0 || !salt || !expectedKey) {
    return false;
  }

  const derivedKey = crypto
    .pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST)
    .toString('hex');

  const expectedBuffer = Buffer.from(expectedKey, 'hex');
  const actualBuffer = Buffer.from(derivedKey, 'hex');

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

