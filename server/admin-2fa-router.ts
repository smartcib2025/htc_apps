import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as twoFAService from "./totp-2fa";
import { getDb } from "./db";
import { userAccounts, twoFactorSettings, twoFactorLogs } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Admin 2FA Management Router
 * Allows admins to view and manage user 2FA settings
 */
export const admin2FARouter = router({
  /**
   * Get list of all users with their 2FA status
   */
  listUsersWithStatus: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }: any) => {
      // Check if user is admin
      if (ctx.user?.role !== "admin") {
        throw new Error("Only admins can access this endpoint");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all user accounts
      const accounts = await db
        .select()
        .from(userAccounts)
        .limit(input.limit)
        .offset(input.offset);

      // Get 2FA settings for each account
      const usersWithStatus = await Promise.all(
        accounts.map(async (account) => {
          const settings = await twoFAService.get2FASettings(account.id);
          return {
            id: account.id,
            username: account.username,
            role: account.role,
            createdAt: account.createdAt,
            lastLoginAt: account.lastLoginAt,
            twoFAEnabled: settings?.isEnabled || false,
            twoFAEnabledAt: settings?.enabledAt,
            twoFALastVerified: settings?.lastVerifiedAt,
            backupCodesCount: settings?.backupCodes ? JSON.parse(settings.backupCodes).length : 0,
          };
        })
      );

      return usersWithStatus;
    }),

  /**
   * Get total count of users
   */
  getUserCount: protectedProcedure.query(async ({ ctx }: any) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Only admins can access this endpoint");
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.select().from(userAccounts);
    return { total: result.length };
  }),

  /**
   * Get detailed 2FA status for a specific user
   */
  getUserStatus: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input, ctx }: any) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Only admins can access this endpoint");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get user account
      const account = await db
        .select()
        .from(userAccounts)
        .where(eq(userAccounts.id, input.userId))
        .limit(1);

      if (!account[0]) {
        throw new Error("User not found");
      }

      // Get 2FA settings
      const settings = await twoFAService.get2FASettings(input.userId);

      // Get recent 2FA logs
      const logs = await twoFAService.get2FALogs(input.userId, 10);

      return {
        user: {
          id: account[0].id,
          username: account[0].username,
          role: account[0].role,
          createdAt: account[0].createdAt,
          lastLoginAt: account[0].lastLoginAt,
        },
        twoFA: {
          isEnabled: settings?.isEnabled || false,
          enabledAt: settings?.enabledAt,
          lastVerifiedAt: settings?.lastVerifiedAt,
          backupCodesCount: settings?.backupCodes ? JSON.parse(settings.backupCodes).length : 0,
        },
        recentLogs: logs,
      };
    }),

  /**
   * Reset 2FA for a user (disable and clear settings)
   */
  resetUserTwoFA: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Only admins can access this endpoint");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify user exists
      const account = await db
        .select()
        .from(userAccounts)
        .where(eq(userAccounts.id, input.userId))
        .limit(1);

      if (!account[0]) {
        throw new Error("User not found");
      }

      // Disable 2FA
      await twoFAService.disable2FA(input.userId, account[0].username);

      // Log the reset action
      await db.insert(twoFactorLogs).values({
        accountId: input.userId,
        email: account[0].username,
        action: "2fa_disabled",
        ipAddress: ctx.ipAddress || "unknown",
        userAgent: ctx.userAgent || "unknown",
        status: "success",
        failureReason: null,
      });

      return {
        success: true,
        message: "2FA reset successfully",
      };
    }),

  /**
   * Regenerate backup codes for a user
   */
  regenerateBackupCodes: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }: any) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Only admins can access this endpoint");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify user exists
      const account = await db
        .select()
        .from(userAccounts)
        .where(eq(userAccounts.id, input.userId))
        .limit(1);

      if (!account[0]) {
        throw new Error("User not found");
      }

      // Get current 2FA settings
      const settings = await twoFAService.get2FASettings(input.userId);
      if (!settings?.isEnabled) {
        throw new Error("User does not have 2FA enabled");
      }

      // Generate new backup codes
      const newCodes = twoFAService.generateBackupCodes();
      const hashedCodes = newCodes.map((code) => {
        const hash = require("crypto").createHash("sha256").update(code).digest("hex");
        return hash;
      });

      // Update backup codes in database
      await db
        .update(twoFactorSettings)
        .set({
          backupCodes: JSON.stringify(hashedCodes),
          updatedAt: new Date(),
        })
        .where(eq(twoFactorSettings.accountId, input.userId));

      // Log the action
      await db.insert(twoFactorLogs).values({
        accountId: input.userId,
        email: account[0].username,
        action: "2fa_enabled",
        ipAddress: ctx.ipAddress || "unknown",
        userAgent: ctx.userAgent || "unknown",
        status: "success",
        failureReason: null,
      });

      return {
        success: true,
        message: "Backup codes regenerated successfully",
        backupCodes: newCodes,
      };
    }),

  /**
   * Get 2FA activity logs for all users
   */
  getActivityLogs: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(100),
        offset: z.number().default(0),
        action: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }: any) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Only admins can access this endpoint");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get logs from database
      let logsQuery = db.select().from(twoFactorLogs) as any;

      if (input.action) {
        logsQuery = logsQuery.where(eq(twoFactorLogs.action, input.action));
      }

      const logs = await logsQuery.limit(input.limit).offset(input.offset);

      // Enrich logs with user information
      const enrichedLogs = await Promise.all(
        (logs || []).map(async (log: any) => {
          const user = await db
            .select()
            .from(userAccounts)
            .where(eq(userAccounts.id, log.accountId))
            .limit(1);

          return {
            ...log,
            username: user[0]?.username || "Unknown",
          };
        })
      );

      return enrichedLogs;
    }),

  /**
   * Get 2FA statistics
   */
  getStatistics: protectedProcedure.query(async ({ ctx }: any) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Only admins can access this endpoint");
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get total users
    const allUsers = await db.select().from(userAccounts);
    const totalUsers = allUsers.length;

    // Get users with 2FA enabled
    const usersWithTwoFA = await Promise.all(
      allUsers.map(async (user) => {
        const settings = await twoFAService.get2FASettings(user.id);
        return settings?.isEnabled ? user : null;
      })
    );
    const twoFAEnabledCount = usersWithTwoFA.filter((u) => u !== null).length;

    // Get recent logs
    const allLogs = await db.select().from(twoFactorLogs);
    const successfulVerifications = allLogs.filter((log) => log.status === "success" && log.action === "2fa_verified").length;
    const failedAttempts = allLogs.filter((log) => log.status === "failed" && log.action === "2fa_verified").length;

    return {
      totalUsers,
      twoFAEnabledCount,
      twoFAEnabledPercentage: ((twoFAEnabledCount / totalUsers) * 100).toFixed(2),
      successfulVerifications,
      failedAttempts,
      totalLogs: allLogs.length,
    };
  }),
});
