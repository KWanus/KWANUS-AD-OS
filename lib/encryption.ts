/**
 * Encryption utilities for sensitive data like API keys
 * Uses AES-256-GCM for authenticated encryption
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    // In development, use a warning key
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[encryption] ENCRYPTION_KEY not set - using insecure dev key. " +
        "Set ENCRYPTION_KEY in production!"
      );
      return Buffer.from("dev-key-insecure-do-not-use-1234567890abcdef", "utf8").subarray(0, KEY_LENGTH);
    }

    throw new Error("ENCRYPTION_KEY environment variable must be set in production");
  }

  // Convert base64 or hex key to buffer, or use raw string
  if (key.length === KEY_LENGTH * 2) {
    // Hex encoded (64 chars for 32 bytes)
    return Buffer.from(key, "hex");
  } else if (key.length === Math.ceil(KEY_LENGTH * 4 / 3)) {
    // Base64 encoded (~44 chars for 32 bytes)
    return Buffer.from(key, "base64");
  } else {
    // Use raw string, pad or truncate to KEY_LENGTH
    return Buffer.from(key.padEnd(KEY_LENGTH, "0"), "utf8").subarray(0, KEY_LENGTH);
  }
}

/**
 * Encrypt a string value
 * @returns Base64 encoded string in format: iv:encrypted:tag
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  // Format: iv:encrypted:tag (all hex encoded)
  return `${iv.toString("hex")}:${encrypted}:${tag.toString("hex")}`;
}

/**
 * Decrypt a string value
 * @param ciphertext Base64 encoded string in format: iv:encrypted:tag
 * @returns Decrypted plaintext
 */
export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const parts = ciphertext.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid ciphertext format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];
  const tag = Buffer.from(parts[2], "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Check if a string is already encrypted (has our format)
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  const parts = value.split(":");
  return parts.length === 3 && parts[0].length === IV_LENGTH * 2;
}

/**
 * Generate a random encryption key (for initial setup)
 * Run this once and store in ENCRYPTION_KEY env var
 */
export function generateEncryptionKey(): string {
  return randomBytes(KEY_LENGTH).toString("hex");
}
