import crypto from "crypto";
import { getDb } from "./db";
import { twoFactorSettings, twoFactorLogs } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import * as emailService from "./email-service";

// ============ TOTP CONSTANTS ============
const TOTP_WINDOW = 1; // Allow 1 time window before and after (30 seconds each)
const TOTP_TIME_STEP = 30; // 30 seconds
const TOTP_DIGITS = 6;
const BACKUP_CODES_COUNT = 10;
const BACKUP_CODE_LENGTH = 8;

// ============ TOTP GENERATION & VERIFICATION ============

/**
 * Generate a random TOTP secret (base32 encoded)
 */
export function generateTOTPSecret(): string {
  const randomBytes = crypto.randomBytes(32);
  return base32Encode(randomBytes);
}

/**
 * Generate TOTP code from secret
 */
export function generateTOTPCode(secret: string, timestamp?: number): string {
  const time = Math.floor((timestamp || Date.now()) / 1000 / TOTP_TIME_STEP);
  const hmac = crypto.createHmac("sha1", base32Decode(secret));
  hmac.update(Buffer.from(time.toString(16).padStart(16, "0"), "hex"));
  const digest = hmac.digest();
  const offset = digest[digest.length - 1] & 0xf;
  const code = (digest.readUInt32BE(offset) & 0x7fffffff) % Math.pow(10, TOTP_DIGITS);
  return code.toString().padStart(TOTP_DIGITS, "0");
}

/**
 * Verify TOTP code
 */
export function verifyTOTPCode(secret: string, code: string, timestamp?: number): boolean {
  const now = timestamp || Date.now();
  const currentCode = generateTOTPCode(secret, now);

  // Check current time window
  if (code === currentCode) {
    return true;
  }

  // Check previous time window
  const prevCode = generateTOTPCode(secret, now - TOTP_TIME_STEP * 1000);
  if (code === prevCode) {
    return true;
  }

  // Check next time window
  const nextCode = generateTOTPCode(secret, now + TOTP_TIME_STEP * 1000);
  if (code === nextCode) {
    return true;
  }

  return false;
}

// ============ BACKUP CODES ============

/**
 * Generate backup codes
 */
export function generateBackupCodes(count: number = BACKUP_CODES_COUNT): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto
      .randomBytes(BACKUP_CODE_LENGTH / 2)
      .toString("hex")
      .toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Format backup codes for display (with dashes)
 */
export function formatBackupCode(code: string): string {
  return code.replace(/(.{4})/g, "$1-").slice(0, -1);
}

// ============ BASE32 ENCODING/DECODING ============

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Encode buffer to base32
 */
function base32Encode(buffer: Buffer): string {
  let bits = "";
  let encoded = "";

  for (let i = 0; i < buffer.length; i++) {
    bits += buffer[i].toString(2).padStart(8, "0");
  }

  for (let i = 0; i + 5 <= bits.length; i += 5) {
    const index = parseInt(bits.substr(i, 5), 2);
    encoded += BASE32_ALPHABET[index];
  }

  return encoded;
}

/**
 * Decode base32 to buffer
 */
function base32Decode(encoded: string): Buffer {
  let bits = "";

  for (let i = 0; i < encoded.length; i++) {
    const index = BASE32_ALPHABET.indexOf(encoded[i]);
    if (index === -1) throw new Error("Invalid base32 character");
    bits += index.toString(2).padStart(5, "0");
  }

  const buffer = Buffer.alloc(bits.length / 8);
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    buffer[i / 8] = parseInt(bits.substr(i, 8), 2);
  }

  return buffer;
}

// ============ 2FA MANAGEMENT ============

/**
 * Get 2FA settings for account
 */
export async function get2FASettings(accountId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(twoFactorSettings)
    .where(eq(twoFactorSettings.accountId, accountId))
    .limit(1);

  return result[0];
}

/**
 * Create 2FA settings
 */
export async function create2FASettings(accountId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(twoFactorSettings).values({
    accountId,
    isEnabled: false,
    totpSecret: generateTOTPSecret(),
    backupCodes: JSON.stringify(generateBackupCodes()),
  });

  return result[0].insertId;
}

/**
 * Enable 2FA for account
 */
export async function enable2FA(
  accountId: number,
  email: string,
  username: string,
  baseUrl?: string
): Promise<{
  success: boolean;
  secret?: string;
  backupCodes?: string[];
  setupLink?: string;
}> {
  const db = await getDb();
  if (!db) return { success: false };

  try {
    const settings = await get2FASettings(accountId);
    if (!settings) {
      await create2FASettings(accountId);
    }

    const updatedSettings = await get2FASettings(accountId);
    if (!updatedSettings || !updatedSettings.totpSecret) {
      return { success: false };
    }

    const backupCodes = JSON.parse(updatedSettings.backupCodes || "[]");

    // Send 2FA setup email
    const setupLink = baseUrl ? `${baseUrl}/2fa-setup?accountId=${accountId}` : "";
    await emailService.send2FASetupEmail({
      email,
      username,
      setupLink,
    });

    // Send backup codes email
    await emailService.sendBackupCodesEmail(email, username, backupCodes);

    // Log 2FA enabled
    await log2FAAction({
      accountId,
      email,
      action: "2fa_enabled",
      status: "success",
    });

    return {
      success: true,
      secret: updatedSettings.totpSecret,
      backupCodes,
      setupLink,
    };
  } catch (error) {
    console.error("[2FA] Failed to enable 2FA:", error);
    return { success: false };
  }
}

/**
 * Verify 2FA and enable it
 */
export async function verify2FAAndEnable(
  accountId: number,
  email: string,
  totpCode: string
): Promise<{
  success: boolean;
  reason?: string;
}> {
  const db = await getDb();
  if (!db) return { success: false, reason: "Database not available" };

  try {
    const settings = await get2FASettings(accountId);
    if (!settings || !settings.totpSecret) {
      return { success: false, reason: "2FA not initialized" };
    }

    // Verify TOTP code
    if (!verifyTOTPCode(settings.totpSecret, totpCode)) {
      await log2FAAction({
        accountId,
        email,
        action: "2fa_failed",
        status: "failed",
        failureReason: "Invalid TOTP code",
      });
      return { success: false, reason: "Invalid verification code" };
    }

    // Enable 2FA
    await db
      .update(twoFactorSettings)
      .set({
        isEnabled: true,
        enabledAt: new Date(),
        lastVerifiedAt: new Date(),
      })
      .where(eq(twoFactorSettings.accountId, accountId));

    await log2FAAction({
      accountId,
      email,
      action: "2fa_verified",
      status: "success",
    });

    return { success: true };
  } catch (error) {
    console.error("[2FA] Failed to verify 2FA:", error);
    return { success: false, reason: "Verification failed" };
  }
}

/**
 * Verify 2FA code during login
 */
export async function verify2FACode(
  accountId: number,
  email: string,
  code: string
): Promise<{
  success: boolean;
  isBackupCode?: boolean;
  reason?: string;
}> {
  const db = await getDb();
  if (!db) return { success: false, reason: "Database not available" };

  try {
    const settings = await get2FASettings(accountId);
    if (!settings || !settings.isEnabled || !settings.totpSecret) {
      return { success: false, reason: "2FA not enabled" };
    }

    // Check if it's a TOTP code
    if (verifyTOTPCode(settings.totpSecret, code)) {
      await log2FAAction({
        accountId,
        email,
        action: "2fa_verified",
        status: "success",
      });
      return { success: true, isBackupCode: false };
    }

    // Check if it's a backup code
    const backupCodes = JSON.parse(settings.backupCodes || "[]");
    const usedBackupCodes = JSON.parse(settings.usedBackupCodes || "[]");

    const codeIndex = backupCodes.indexOf(code);
    if (codeIndex !== -1 && !usedBackupCodes.includes(code)) {
      // Mark backup code as used
      usedBackupCodes.push(code);
      await db
        .update(twoFactorSettings)
        .set({
          usedBackupCodes: JSON.stringify(usedBackupCodes),
          lastVerifiedAt: new Date(),
        })
        .where(eq(twoFactorSettings.accountId, accountId));

      await log2FAAction({
        accountId,
        email,
        action: "backup_code_used",
        status: "success",
      });

      return { success: true, isBackupCode: true };
    }

    // Invalid code
    await log2FAAction({
      accountId,
      email,
      action: "2fa_failed",
      status: "failed",
      failureReason: "Invalid 2FA code",
    });

    return { success: false, reason: "Invalid verification code" };
  } catch (error) {
    console.error("[2FA] Failed to verify 2FA code:", error);
    return { success: false, reason: "Verification failed" };
  }
}

/**
 * Disable 2FA
 */
export async function disable2FA(accountId: number, email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(twoFactorSettings)
      .set({
        isEnabled: false,
        totpSecret: null,
        backupCodes: null,
        usedBackupCodes: null,
      })
      .where(eq(twoFactorSettings.accountId, accountId));

    await log2FAAction({
      accountId,
      email,
      action: "2fa_disabled",
      status: "success",
    });

    return true;
  } catch (error) {
    console.error("[2FA] Failed to disable 2FA:", error);
    return false;
  }
}

/**
 * Log 2FA action
 */
export async function log2FAAction(data: {
  accountId: number;
  email: string;
  action: "2fa_enabled" | "2fa_disabled" | "2fa_verified" | "2fa_failed" | "backup_code_used";
  status: "success" | "failed";
  ipAddress?: string;
  userAgent?: string;
  failureReason?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[2FA] Database not available for logging");
    return;
  }

  try {
    await db.insert(twoFactorLogs).values({
      accountId: data.accountId,
      email: data.email,
      action: data.action,
      status: data.status,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      failureReason: data.failureReason,
    });
  } catch (error) {
    console.error("[2FA] Failed to log 2FA action:", error);
  }
}

/**
 * Get 2FA logs for account
 */
export async function get2FALogs(accountId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(twoFactorLogs)
    .where(eq(twoFactorLogs.accountId, accountId))
    .orderBy((t) => t.createdAt)
    .limit(limit);

  return result;
}

/**
 * Generate QR code URI for TOTP setup
 */
export function generateTOTPURI(
  secret: string,
  email: string,
  issuer: string = "Hanuman Tennis Academy"
): string {
  const encodedEmail = encodeURIComponent(email);
  const encodedIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}`;
}
