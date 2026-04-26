// ---------------------------------------------------------------------------
// OAuth Token Encryption — encrypt/decrypt access tokens for secure storage
// Uses AES-256-CBC encryption
// ---------------------------------------------------------------------------

import crypto from "crypto";

const ENCRYPTION_KEY = process.env.OAUTH_ENCRYPTION_KEY || "himalaya-change-this-in-production-32chars!!";
const ALGORITHM = "aes-256-cbc";

// Ensure key is exactly 32 bytes for AES-256
const KEY = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));

/**
 * Encrypt a token for secure storage
 */
export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Return IV + encrypted data (separated by :)
  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt a token from storage
 */
export function decryptToken(encryptedToken: string): string {
  const [ivHex, encrypted] = encryptedToken.split(":");

  if (!ivHex || !encrypted) {
    throw new Error("Invalid encrypted token format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
