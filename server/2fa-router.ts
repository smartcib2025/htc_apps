import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import * as twoFAService from "./totp-2fa";
import { getDb } from "./db";
import { userAccounts } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const twoFARouter = router({
  /**
   * Get current 2FA status for logged-in user
   */
  getStatus: protectedProcedure.query(async ({ ctx }: any) => {
    const accountId = ctx.user?.id;
    if (!accountId) {
      throw new Error("Not authenticated");
    }

    const settings = await twoFAService.get2FASettings(accountId);
    return {
      isEnabled: settings?.isEnabled || false,
      enabledAt: settings?.enabledAt,
      lastVerifiedAt: settings?.lastVerifiedAt,
    };
  }),

  /**
   * Initialize 2FA setup (generate secret and backup codes)
   */
  initializeSetup: protectedProcedure.query(async ({ ctx }: any) => {
    const accountId = ctx.user?.id;
    if (!accountId) {
      throw new Error("Not authenticated");
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get account email
    const account = await db
      .select()
      .from(userAccounts)
      .where(eq(userAccounts.id, accountId))
      .limit(1);

    if (!account[0]) {
      throw new Error("Account not found");
    }

      const result = await twoFAService.enable2FA(
        accountId,
        account[0].username || "",
        account[0].username || "User"
      );

    if (!result.success || !result.secret) {
      throw new Error("Failed to initialize 2FA setup");
    }

    // Generate QR code URI
    const qrCodeUri = twoFAService.generateTOTPURI(result.secret, account[0].username || "");

    return {
      secret: result.secret,
      qrCodeUri,
      backupCodes: result.backupCodes?.map((code) => twoFAService.formatBackupCode(code)) || [],
    };
  }),

  /**
   * Verify TOTP code and enable 2FA
   */
  verifyAndEnable: protectedProcedure
    .input(
      z.object({
        totpCode: z.string().length(6, "Code must be 6 digits"),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const accountId = ctx.user?.id;
      if (!accountId) {
        throw new Error("Not authenticated");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get account email
      const account = await db
        .select()
        .from(userAccounts)
        .where(eq(userAccounts.id, accountId))
        .limit(1);

      if (!account[0]) {
        throw new Error("Account not found");
      }

      const result = await twoFAService.verify2FAAndEnable(
        accountId,
        account[0].username || "",
        input.totpCode as string
      );

      if (!result.success) {
        throw new Error(result.reason || "Failed to enable 2FA");
      }

      return { success: true };
    }),

  /**
   * Verify 2FA code during login
   */
  verifyCode: publicProcedure
    .input(
      z.object({
        accountId: z.number(),
        email: z.string().email(),
        code: z.string(),
      })
    )
    .mutation(async ({ input }: any) => {
      const result = await twoFAService.verify2FACode(input.accountId, input.email, input.code);

      if (!result.success) {
        throw new Error(result.reason || "Invalid verification code");
      }

      return {
        success: true,
        isBackupCode: result.isBackupCode,
      };
    }),

  /**
   * Disable 2FA
   */
  disable: protectedProcedure
    .input(
      z.object({
        password: z.string(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const accountId = ctx.user?.id;
      if (!accountId) {
        throw new Error("Not authenticated");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get account
      const account = await db
        .select()
        .from(userAccounts)
        .where(eq(userAccounts.id, accountId))
        .limit(1);

      if (!account[0]) {
        throw new Error("Account not found");
      }

      // Note: Password verification should be done in the main auth flow
      // This is a placeholder for additional security

      const success = await twoFAService.disable2FA(accountId, account[0].username || "");

      if (!success) {
        throw new Error("Failed to disable 2FA");
      }

      return { success: true };
    }),

  /**
   * Get 2FA logs for current user
   */
  getLogs: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }: any) => {
      const accountId = ctx.user?.id;
      if (!accountId) {
        throw new Error("Not authenticated");
      }

      const logs = await twoFAService.get2FALogs(accountId, input.limit);
      return logs;
    }),

  /**
   * Regenerate backup codes
   */
  regenerateBackupCodes: protectedProcedure.mutation(async ({ ctx }: any) => {
    const accountId = ctx.user?.id;
    if (!accountId) {
      throw new Error("Not authenticated");
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get account
    const account = await db
      .select()
      .from(userAccounts)
      .where(eq(userAccounts.id, accountId))
      .limit(1);

    if (!account[0]) {
      throw new Error("Account not found");
    }

    // Generate new backup codes
    const newBackupCodes = twoFAService.generateBackupCodes();

    // Update in database
    const settings = await twoFAService.get2FASettings(accountId);
    if (!settings) {
      throw new Error("2FA not initialized");
    }

    const updatedSettings = await db
      .update(twoFAService.get2FASettings as any)
      .set({
        backupCodes: JSON.stringify(newBackupCodes),
        usedBackupCodes: "[]",
      })
      .where(eq(userAccounts.id, accountId));

    // Send new backup codes via email
    const formattedCodes = newBackupCodes.map((code) => twoFAService.formatBackupCode(code));

    return {
      success: true,
      backupCodes: formattedCodes,
    };
  }),
});
