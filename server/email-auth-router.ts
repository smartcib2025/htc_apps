import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as emailAuth from "./email-auth";
import * as db from "./db";
import { createAccountSessionToken } from "./tenant";

export const emailAuthRouter = router({
  // ============ EMAIL LOGIN ENDPOINTS ============

  /**
   * Register with email
   */
  registerWithEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string(),
        username: z.string().min(3).max(100),
        displayName: z.string().optional(),
        role: z.enum(["player", "coach", "head_coach", "admin"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Validate password match
      if (input.password !== input.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // Check if email already exists
      const existingEmail = await emailAuth.getEmailLoginByEmail(input.email);
      if (existingEmail) {
        throw new Error("Email already registered");
      }

      // Create user account first
      const accountId = await db.createUserAccount({
        username: input.username,
        passwordHash: emailAuth.hashPassword(input.password),
        role: (input.role || "player") as any,
        displayName: input.displayName || input.username,
        isActive: true,
      });

      // Create email login
      await emailAuth.createEmailLogin({
        accountId,
        email: input.email,
        password: input.password,
      });

      // Log account creation
      await emailAuth.logAccess({
        accountId,
        email: input.email,
        username: input.username,
        role: input.role || "player",
        loginMethod: "email",
        action: "account_created",
        ipAddress: ctx.req?.ip,
        userAgent: ctx.req?.headers["user-agent"],
        status: "success",
      });

      return {
        success: true,
        message: "Account created. Please verify your email.",
        accountId,
      };
    }),

  /**
   * Login with email
   */
  loginWithEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await emailAuth.authenticateEmailLogin(
        input.email,
        input.password,
        ctx.req?.ip,
        ctx.req?.headers["user-agent"]
      );

      if (!result.success) {
        throw new Error(result.reason || "Login failed");
      }
      if (!result.accountId) {
        throw new Error("Login succeeded without an account identity");
      }
      const account = await db.getUserAccountById(result.accountId);
      if (!account) {
        throw new Error("Authenticated account could not be loaded");
      }

      return {
        success: true,
        requires2FA: Boolean((result as any).requires2FA),
        accountId: result.accountId,
        sessionToken: createAccountSessionToken(result.accountId),
        account: {
          id: account.id,
          username: account.username,
          role: account.role,
          displayName: account.displayName,
          playerId: account.playerId,
          coachId: account.coachId,
        },
      };
    }),

  /**
   * Verify email
   */
  verifyEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        token: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const success = await emailAuth.verifyEmailLogin(input.email, input.token);

      if (!success) {
        throw new Error("Invalid or expired verification token");
      }

      await emailAuth.logAccess({
        email: input.email,
        loginMethod: "email",
        action: "email_verified",
        ipAddress: ctx.req?.ip,
        userAgent: ctx.req?.headers["user-agent"],
        status: "success",
      });

      return { success: true, message: "Email verified successfully" };
    }),

  /**
   * Request password reset
   */
  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const result = await emailAuth.requestPasswordReset(input.email);

      if (!result.success) {
        throw new Error(result.reason || "Failed to request password reset");
      }

      // In production, send email with reset link
      // For now, return token for testing
      return {
        success: true,
        message: "Password reset link sent to your email",
        resetToken: result.resetToken, // Remove in production
      };
    }),

  /**
   * Reset password
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        resetToken: z.string(),
        newPassword: z.string().min(8),
        confirmPassword: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.newPassword !== input.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const result = await emailAuth.resetPassword(
        input.email,
        input.resetToken,
        input.newPassword
      );

      if (!result.success) {
        throw new Error(result.reason || "Failed to reset password");
      }

      return { success: true, message: "Password reset successfully" };
    }),

  /**
   * Change password (for logged-in users)
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8),
        confirmPassword: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.newPassword !== input.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (input.currentPassword === input.newPassword) {
        throw new Error("New password must be different from current password");
      }

      // Get user's email login
      if (!ctx.user?.id) {
        throw new Error("Not authenticated");
      }

      const emailLogin = await emailAuth.getEmailLoginByAccountId(ctx.user.id);
      if (!emailLogin) {
        throw new Error("Email login not found");
      }

      // Verify current password
      if (!emailAuth.verifyPassword(input.currentPassword, emailLogin.passwordHash)) {
        await emailAuth.logAccess({
          accountId: ctx.user.id,
          email: emailLogin.email,
          loginMethod: "email",
          action: "login_attempt_failed",
          ipAddress: ctx.req?.ip,
          userAgent: ctx.req?.headers["user-agent"],
          status: "failed",
          failureReason: "Invalid current password",
        });
        throw new Error("Current password is incorrect");
      }

      // Update password
      const newPasswordHash = emailAuth.hashPassword(input.newPassword);
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      const { emailLogins } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      await dbInstance
        .update(emailLogins)
        .set({
          passwordHash: newPasswordHash,
          loginAttempts: 0,
          isLocked: false,
          lockedUntil: null,
        })
        .where(eq(emailLogins.id, emailLogin.id));

      await emailAuth.logAccess({
        accountId: ctx.user.id,
        email: emailLogin.email,
        loginMethod: "email",
        action: "password_reset_completed",
        ipAddress: ctx.req?.ip,
        userAgent: ctx.req?.headers["user-agent"],
        status: "success",
      });

      return { success: true, message: "Password changed successfully" };
    }),

  // ============ ACCESS LOG ENDPOINTS ============

  /**
   * Get access logs for current user
   */
  getMyAccessLogs: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user?.id) {
        throw new Error("Not authenticated");
      }

      return emailAuth.getAccessLogsByAccountId(ctx.user.id, input.limit);
    }),

  /**
   * Get all access logs (admin only)
   */
  getAllAccessLogs: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user?.id || ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }

      return emailAuth.getAllAccessLogs(input.limit);
    }),

  /**
   * Get access logs by email (admin only)
   */
  getAccessLogsByEmail: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.user?.id || ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }

      return emailAuth.getAccessLogsByEmail(input.email, input.limit);
    }),

  /**
   * Get access logs by date range (admin only)
   */
  getAccessLogsByDateRange: protectedProcedure
    .input(
      z.object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.user?.id || ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }

      return emailAuth.getAccessLogsByDateRange(
        new Date(input.startDate),
        new Date(input.endDate),
        input.limit
      );
    }),

  /**
   * Get failed login attempts (admin only)
   */
  getFailedLoginAttempts: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user?.id || ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }

      return emailAuth.getFailedLoginAttempts(input.limit);
    }),

  /**
   * Get locked accounts (admin only)
   */
  getLockedAccounts: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id || ctx.user?.role !== "admin") {
      throw new Error("Unauthorized");
    }

    return emailAuth.getLockedAccounts();
  }),

  /**
   * Unlock account (admin only)
   */
  unlockAccount: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.id || ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const success = await emailAuth.unlockAccount(input.email);
      if (!success) {
        throw new Error("Failed to unlock account");
      }

      return { success: true, message: "Account unlocked" };
    }),
});
