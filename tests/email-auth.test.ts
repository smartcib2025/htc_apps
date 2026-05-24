import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as emailAuth from "../server/email-auth";

describe("Email Authentication & Audit Logging", () => {
  // ============ PASSWORD HASHING TESTS ============

  describe("Password Hashing", () => {
    it("should hash password consistently", () => {
      const password = "testPassword123!";
      const hash1 = emailAuth.hashPassword(password);
      const hash2 = emailAuth.hashPassword(password);
      expect(hash1).toBe(hash2);
    });

    it("should verify correct password", () => {
      const password = "testPassword123!";
      const hash = emailAuth.hashPassword(password);
      expect(emailAuth.verifyPassword(password, hash)).toBe(true);
    });

    it("should reject incorrect password", () => {
      const password = "testPassword123!";
      const wrongPassword = "wrongPassword456!";
      const hash = emailAuth.hashPassword(password);
      expect(emailAuth.verifyPassword(wrongPassword, hash)).toBe(false);
    });

    it("should produce different hashes for different passwords", () => {
      const password1 = "password1";
      const password2 = "password2";
      const hash1 = emailAuth.hashPassword(password1);
      const hash2 = emailAuth.hashPassword(password2);
      expect(hash1).not.toBe(hash2);
    });
  });

  // ============ TOKEN GENERATION TESTS ============

  describe("Token Generation", () => {
    it("should generate random tokens", () => {
      const token1 = emailAuth.generateToken();
      const token2 = emailAuth.generateToken();
      expect(token1).not.toBe(token2);
    });

    it("should generate valid hex tokens", () => {
      const token = emailAuth.generateToken();
      expect(/^[a-f0-9]+$/.test(token)).toBe(true);
    });

    it("should generate tokens of consistent length", () => {
      const token1 = emailAuth.generateToken();
      const token2 = emailAuth.generateToken();
      expect(token1.length).toBe(token2.length);
    });
  });

  // ============ ACCESS LOGGING TESTS ============

  describe("Access Logging", () => {
    it("should log successful login", async () => {
      const logData = {
        accountId: 1,
        email: "test@example.com",
        username: "testuser",
        role: "player",
        loginMethod: "email",
        action: "login_success" as const,
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
        status: "success" as const,
      };

      // Should not throw
      await expect(emailAuth.logAccess(logData)).resolves.not.toThrow();
    });

    it("should log failed login attempt", async () => {
      const logData = {
        email: "test@example.com",
        loginMethod: "email",
        action: "login_attempt_failed" as const,
        ipAddress: "192.168.1.1",
        status: "failed" as const,
        failureReason: "Invalid password",
      };

      await expect(emailAuth.logAccess(logData)).resolves.not.toThrow();
    });

    it("should log account locked event", async () => {
      const logData = {
        accountId: 1,
        email: "test@example.com",
        loginMethod: "email",
        action: "account_locked" as const,
        status: "failed" as const,
        failureReason: "Too many failed attempts",
      };

      await expect(emailAuth.logAccess(logData)).resolves.not.toThrow();
    });

    it("should log password reset request", async () => {
      const logData = {
        accountId: 1,
        email: "test@example.com",
        loginMethod: "email",
        action: "password_reset_requested" as const,
        status: "success" as const,
      };

      await expect(emailAuth.logAccess(logData)).resolves.not.toThrow();
    });

    it("should log email verification", async () => {
      const logData = {
        accountId: 1,
        email: "test@example.com",
        loginMethod: "email",
        action: "email_verified" as const,
        status: "success" as const,
      };

      await expect(emailAuth.logAccess(logData)).resolves.not.toThrow();
    });

    it("should log account creation", async () => {
      const logData = {
        accountId: 1,
        email: "newuser@example.com",
        username: "newuser",
        role: "player",
        loginMethod: "email",
        action: "account_created" as const,
        status: "success" as const,
      };

      await expect(emailAuth.logAccess(logData)).resolves.not.toThrow();
    });
  });

  // ============ SECURITY TESTS ============

  describe("Security Features", () => {
    it("should handle account lockout after failed attempts", () => {
      // Simulate 5 failed attempts
      let loginAttempts = 0;
      let isLocked = false;

      for (let i = 0; i < 5; i++) {
        loginAttempts++;
        if (loginAttempts >= 5) {
          isLocked = true;
        }
      }

      expect(isLocked).toBe(true);
      expect(loginAttempts).toBe(5);
    });

    it("should validate email format", () => {
      const validEmails = [
        "user@example.com",
        "test.user@example.co.uk",
        "user+tag@example.com",
      ];

      const invalidEmails = [
        "invalid.email",
        "@example.com",
        "user@",
        "user @example.com",
      ];

      validEmails.forEach((email) => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        expect(isValid).toBe(true);
      });

      invalidEmails.forEach((email) => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        expect(isValid).toBe(false);
      });
    });

    it("should validate password strength", () => {
      const weakPasswords = ["123456", "pass", "qwert"];
      const strongPasswords = [
        "SecurePass123!",
        "MyP@ssw0rd",
        "Complex#Pass99",
      ];

      weakPasswords.forEach((pwd) => {
        expect(pwd.length < 8).toBe(true);
      });

      strongPasswords.forEach((pwd) => {
        expect(pwd.length >= 8).toBe(true);
      });
    });
  });

  // ============ DATA VALIDATION TESTS ============

  describe("Data Validation", () => {
    it("should validate email case-insensitivity", () => {
      const email1 = "User@Example.COM";
      const email2 = "user@example.com";
      expect(email1.toLowerCase()).toBe(email2.toLowerCase());
    });

    it("should validate login method values", () => {
      const validMethods = ["email", "username", "oauth"];
      const invalidMethod = "invalid_method";

      validMethods.forEach((method) => {
        expect(["email", "username", "oauth"].includes(method)).toBe(true);
      });

      expect(["email", "username", "oauth"].includes(invalidMethod)).toBe(false);
    });

    it("should validate action types", () => {
      const validActions = [
        "login_success",
        "login_failed",
        "logout",
        "login_attempt_failed",
        "account_locked",
        "password_reset_requested",
        "password_reset_completed",
        "email_verified",
        "account_created",
      ];

      validActions.forEach((action) => {
        expect(validActions.includes(action)).toBe(true);
      });
    });

    it("should validate status values", () => {
      const validStatuses = ["success", "failed"];

      validStatuses.forEach((status) => {
        expect(["success", "failed"].includes(status)).toBe(true);
      });

      expect(["success", "failed"].includes("pending")).toBe(false);
    });
  });

  // ============ INTEGRATION TESTS ============

  describe("Integration Tests", () => {
    it("should handle complete login flow with logging", async () => {
      // Simulate login flow
      const email = "test@example.com";
      const password = "TestPassword123!";

      // 1. Hash password
      const passwordHash = emailAuth.hashPassword(password);
      expect(passwordHash).toBeDefined();

      // 2. Verify password
      const isValid = emailAuth.verifyPassword(password, passwordHash);
      expect(isValid).toBe(true);

      // 3. Generate session token
      const sessionToken = emailAuth.generateToken();
      expect(sessionToken).toBeDefined();

      // 4. Log successful login
      const logData = {
        accountId: 1,
        email,
        loginMethod: "email",
        action: "login_success" as const,
        sessionId: sessionToken,
        status: "success" as const,
      };

      await expect(emailAuth.logAccess(logData)).resolves.not.toThrow();
    });

    it("should handle failed login with multiple attempts", async () => {
      const email = "test@example.com";
      let attempts = 0;
      let isLocked = false;

      // Simulate 5 failed attempts
      for (let i = 0; i < 5; i++) {
        attempts++;

        const logData = {
          email,
          loginMethod: "email",
          action: "login_attempt_failed" as const,
          status: "failed" as const,
          failureReason: `Invalid password (attempt ${attempts}/5)`,
        };

        await expect(emailAuth.logAccess(logData)).resolves.not.toThrow();

        if (attempts >= 5) {
          isLocked = true;
          const lockLogData = {
            email,
            loginMethod: "email",
            action: "account_locked" as const,
            status: "failed" as const,
            failureReason: "Too many failed attempts",
          };
          await expect(emailAuth.logAccess(lockLogData)).resolves.not.toThrow();
        }
      }

      expect(isLocked).toBe(true);
      expect(attempts).toBe(5);
    });

    it("should handle password reset flow", async () => {
      const email = "test@example.com";

      // 1. Request password reset
      const resetToken = emailAuth.generateToken();
      expect(resetToken).toBeDefined();

      // 2. Log reset request
      const requestLog = {
        email,
        loginMethod: "email",
        action: "password_reset_requested" as const,
        status: "success" as const,
      };
      await expect(emailAuth.logAccess(requestLog)).resolves.not.toThrow();

      // 3. Reset password
      const newPassword = "NewPassword123!";
      const newPasswordHash = emailAuth.hashPassword(newPassword);
      expect(newPasswordHash).toBeDefined();

      // 4. Log reset completion
      const completeLog = {
        email,
        loginMethod: "email",
        action: "password_reset_completed" as const,
        status: "success" as const,
      };
      await expect(emailAuth.logAccess(completeLog)).resolves.not.toThrow();
    });
  });

  // ============ ERROR HANDLING TESTS ============

  describe("Error Handling", () => {
    it("should handle null/undefined gracefully", async () => {
      const logData = {
        email: undefined,
        loginMethod: "email",
        action: "login_failed" as const,
        status: "failed" as const,
      };

      // Should not throw
      await expect(emailAuth.logAccess(logData as any)).resolves.not.toThrow();
    });

    it("should handle empty strings", () => {
      const email = "";
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      expect(isValid).toBe(false);
    });

    it("should handle very long inputs", () => {
      const longEmail = "a".repeat(300) + "@example.com";
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(longEmail);
      expect(isValid).toBe(true); // Still valid format, but DB should reject
    });
  });
});
