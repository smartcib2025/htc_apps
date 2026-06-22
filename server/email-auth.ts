import { eq, and, gt, desc, gte, lte } from "drizzle-orm";
import { getDb } from "./db";
import { emailLogins, accessLogs, userAccounts } from "../drizzle/schema";
import crypto from "crypto";
import * as emailService from "./email-service";

// ============ UTILITY FUNCTIONS ============

/**
 * Hash password using SHA256
 */
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Verify password
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * Generate random token
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Log user access
 */
export async function logAccess(data: {
  accountId?: number | null;
  email?: string;
  username?: string;
  role?: string;
  loginMethod: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  status: "success" | "failed";
  failureReason?: string;
  sessionId?: string;
  duration?: number;
}): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[AccessLog] Database not available");
    return;
  }

  try {
    await db.insert(accessLogs).values({
      accountId: data.accountId || null,
      email: data.email || null,
      username: data.username || null,
      role: (data.role as any) || null,
      loginMethod: data.loginMethod,
      action: (data.action as any),
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      deviceInfo: data.deviceInfo || null,
      status: data.status,
      failureReason: data.failureReason || null,
      sessionId: data.sessionId || null,
      duration: data.duration || null,
    });
  } catch (error) {
    console.error("[AccessLog] Failed to log access:", error);
  }
}

// ============ EMAIL LOGIN QUERIES ============

/**
 * Get email login by email
 */
export async function getEmailLoginByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(emailLogins)
    .where(eq(emailLogins.email, email.toLowerCase()))
    .limit(1);

  return result[0];
}

/**
 * Get email login by account ID
 */
export async function getEmailLoginByAccountId(accountId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(emailLogins)
    .where(eq(emailLogins.accountId, accountId))
    .limit(1);

  return result[0];
}

/**
 * Create email login
 */
export async function createEmailLogin(data: {
  accountId: number;
  email: string;
  password: string;
  username?: string;
  baseUrl?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const passwordHash = hashPassword(data.password);
  const verificationToken = generateToken();

  const result = await db.insert(emailLogins).values({
    accountId: data.accountId,
    email: data.email.toLowerCase(),
    passwordHash,
    isVerified: false,
    verificationToken,
    verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });

  // Send verification email
  const verificationLink = data.baseUrl
    ? `${data.baseUrl}/verify-email?email=${encodeURIComponent(data.email)}&token=${verificationToken}`
    : verificationToken;

  await emailService.sendVerificationEmail({
    email: data.email,
    username: data.username || "User",
    verificationToken,
    verificationLink,
  });

  return result[0].insertId;
}

/**
 * Verify email
 */
export async function verifyEmailLogin(email: string, token: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const emailLogin = await getEmailLoginByEmail(email);
  if (!emailLogin) return false;

  // Check token and expiry
  if (
    emailLogin.verificationToken !== token ||
    !emailLogin.verificationTokenExpiry ||
    emailLogin.verificationTokenExpiry < new Date()
  ) {
    return false;
  }

  // Update email login
  await db
    .update(emailLogins)
    .set({
      isVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    })
    .where(eq(emailLogins.email, email.toLowerCase()));

  return true;
}

/**
 * Authenticate email login
 */
export async function authenticateEmailLogin(
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{
  success: boolean;
  accountId?: number;
  reason?: string;
}> {
  const db = await getDb();
  if (!db) {
    return { success: false, reason: "Database not available" };
  }

  const emailLogin = await getEmailLoginByEmail(email);

  // Log failed attempt if email not found
  if (!emailLogin) {
    await logAccess({
      email,
      loginMethod: "email",
      action: "login_failed",
      ipAddress,
      userAgent,
      status: "failed",
      failureReason: "Email not found",
    });
    return { success: false, reason: "Invalid email or password" };
  }

  // Check if account is locked
  if (emailLogin.isLocked && emailLogin.lockedUntil && emailLogin.lockedUntil > new Date()) {
    await logAccess({
      accountId: emailLogin.accountId,
      email,
      loginMethod: "email",
      action: "account_locked",
      ipAddress,
      userAgent,
      status: "failed",
      failureReason: "Account locked due to too many failed attempts",
    });
    return { success: false, reason: "Account locked. Please try again later." };
  }

  // Check if email is verified
  if (!emailLogin.isVerified) {
    await logAccess({
      accountId: emailLogin.accountId,
      email,
      loginMethod: "email",
      action: "login_failed",
      ipAddress,
      userAgent,
      status: "failed",
      failureReason: "Email not verified",
    });
    return { success: false, reason: "Please verify your email first" };
  }

  // Verify password
  if (!verifyPassword(password, emailLogin.passwordHash)) {
    const newAttempts = (emailLogin.loginAttempts || 0) + 1;
    const isLocked = newAttempts >= 5;
    const lockedUntil = isLocked ? new Date(Date.now() + 30 * 60 * 1000) : null; // 30 minutes

    // Update login attempts
    await db
      .update(emailLogins)
      .set({
        loginAttempts: newAttempts,
        isLocked,
        lockedUntil,
      })
      .where(eq(emailLogins.email, email.toLowerCase()));

    await logAccess({
      accountId: emailLogin.accountId,
      email,
      loginMethod: "email",
      action: isLocked ? "account_locked" : "login_attempt_failed",
      ipAddress,
      userAgent,
      status: "failed",
      failureReason: `Invalid password (attempt ${newAttempts}/5)`,
    });

    return {
      success: false,
      reason: isLocked
        ? "Too many failed attempts. Account locked for 30 minutes."
        : `Invalid email or password (${newAttempts}/5 attempts)`,
    };
  }

  // Reset login attempts on successful login
  await db
    .update(emailLogins)
    .set({
      loginAttempts: 0,
      isLocked: false,
      lockedUntil: null,
      lastLoginAt: new Date(),
    })
    .where(eq(emailLogins.email, email.toLowerCase()));

  // Get account details for logging
  const account = await db
    .select()
    .from(userAccounts)
    .where(eq(userAccounts.id, emailLogin.accountId))
    .limit(1);

  await logAccess({
    accountId: emailLogin.accountId,
    email,
    username: account[0]?.username,
    role: account[0]?.role,
    loginMethod: "email",
    action: "login_success",
    ipAddress,
    userAgent,
    status: "success",
  });

  return { success: true, accountId: emailLogin.accountId };
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string, baseUrl?: string): Promise<{
  success: boolean;
  resetToken?: string;
  reason?: string;
}> {
  const db = await getDb();
  if (!db) return { success: false, reason: "Database not available" };

  const emailLogin = await getEmailLoginByEmail(email);
  if (!emailLogin) {
    // Don't reveal if email exists
    return { success: true };
  }

  const resetToken = generateToken();
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db
    .update(emailLogins)
    .set({
      resetToken,
      resetTokenExpiry,
    })
    .where(eq(emailLogins.email, email.toLowerCase()));

  // Get account info for email
  const account = await db
    .select()
    .from(userAccounts)
    .where(eq(userAccounts.id, emailLogin.accountId))
    .limit(1);

  // Send password reset email
  const resetLink = baseUrl
    ? `${baseUrl}/reset-password?email=${encodeURIComponent(email)}&token=${resetToken}`
    : resetToken;

  await emailService.sendPasswordResetEmail({
    email,
    username: account[0]?.username || "User",
    resetToken,
    resetLink,
  });

  await logAccess({
    accountId: emailLogin.accountId,
    email,
    loginMethod: "email",
    action: "password_reset_requested",
    status: "success",
  });

  return { success: true };
}

/**
 * Reset password with token
 */
export async function resetPassword(
  email: string,
  resetToken: string,
  newPassword: string
): Promise<{
  success: boolean;
  reason?: string;
}> {
  const db = await getDb();
  if (!db) return { success: false, reason: "Database not available" };

  const emailLogin = await getEmailLoginByEmail(email);
  if (!emailLogin) {
    return { success: false, reason: "Invalid email or token" };
  }

  // Check token and expiry
  if (
    emailLogin.resetToken !== resetToken ||
    !emailLogin.resetTokenExpiry ||
    emailLogin.resetTokenExpiry < new Date()
  ) {
    await logAccess({
      accountId: emailLogin.accountId,
      email,
      loginMethod: "email",
      action: "login_failed",
      status: "failed",
      failureReason: "Invalid or expired reset token",
    });
    return { success: false, reason: "Invalid or expired reset token" };
  }

  const newPasswordHash = hashPassword(newPassword);

  await db
    .update(emailLogins)
    .set({
      passwordHash: newPasswordHash,
      resetToken: null,
      resetTokenExpiry: null,
      loginAttempts: 0,
      isLocked: false,
      lockedUntil: null,
    })
    .where(eq(emailLogins.email, email.toLowerCase()));

  await logAccess({
    accountId: emailLogin.accountId,
    email,
    loginMethod: "email",
    action: "password_reset_completed",
    status: "success",
  });

  return { success: true };
}

// ============ ACCESS LOG QUERIES ============

/**
 * Get access logs for a user
 */
export async function getAccessLogsByAccountId(
  accountId: number,
  limit: number = 50
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(accessLogs)
    .where(eq(accessLogs.accountId, accountId))
    .orderBy(desc(accessLogs.createdAt))
    .limit(limit);
}

/**
 * Get access logs for all users (admin only)
 */
export async function getAllAccessLogs(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(accessLogs)
    .orderBy(desc(accessLogs.createdAt))
    .limit(limit);
}

/**
 * Get access logs by email
 */
export async function getAccessLogsByEmail(email: string, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(accessLogs)
    .where(eq(accessLogs.email, email))
    .orderBy(desc(accessLogs.createdAt))
    .limit(limit);
}

/**
 * Get access logs by date range
 */
export async function getAccessLogsByDateRange(
  startDate: Date,
  endDate: Date,
  limit: number = 100
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(accessLogs)
    .where(
      and(
        gte(accessLogs.createdAt, startDate),
        lte(accessLogs.createdAt, endDate)
      )
    )
    .orderBy(desc(accessLogs.createdAt))
    .limit(limit);
}

/**
 * Get failed login attempts
 */
export async function getFailedLoginAttempts(
  limit: number = 50
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(accessLogs)
    .where(
      and(
        eq(accessLogs.status, "failed"),
        eq(accessLogs.action, "login_attempt_failed")
      )
    )
    .orderBy(desc(accessLogs.createdAt))
    .limit(limit);
}

/**
 * Get locked accounts
 */
export async function getLockedAccounts() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(emailLogins)
    .where(eq(emailLogins.isLocked, true));
}

/**
 * Unlock account
 */
export async function unlockAccount(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const emailLogin = await getEmailLoginByEmail(email);
  if (!emailLogin) return false;

  await db
    .update(emailLogins)
    .set({
      isLocked: false,
      lockedUntil: null,
      loginAttempts: 0,
    })
    .where(eq(emailLogins.email, email.toLowerCase()));

  await logAccess({
    accountId: emailLogin.accountId,
    email,
    loginMethod: "email",
    action: "login_success",
    status: "success",
  });

  return true;
}
