import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// Salt size and derived-key length for scrypt. 16/64 are the Node defaults.
const SALT_BYTES = 16;
const KEY_BYTES = 64;

// Hash a share password. Stored format: "<saltHex>:<derivedHex>".
// scrypt is sufficient for low-stakes share passwords (view-gate, not auth).
export function hashSharePassword(plain: string): string {
  const salt = randomBytes(SALT_BYTES);
  const derived = scryptSync(plain.normalize("NFKC"), salt, KEY_BYTES);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

// Verify a candidate password against a stored hash. Constant-time compare.
// Returns false on any malformed hash.
export function verifySharePassword(plain: string, hash: string): boolean {
  const parts = hash.split(":");
  if (parts.length !== 2) return false;
  const [saltHex, derivedHex] = parts;
  let salt: Buffer;
  let stored: Buffer;
  try {
    salt = Buffer.from(saltHex, "hex");
    stored = Buffer.from(derivedHex, "hex");
  } catch {
    return false;
  }
  if (stored.length !== KEY_BYTES) return false;
  const candidate = scryptSync(plain.normalize("NFKC"), salt, KEY_BYTES);
  return timingSafeEqual(stored, candidate);
}
