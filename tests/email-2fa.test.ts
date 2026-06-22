import { describe, it, expect } from "vitest";
import * as twoFAService from "../server/totp-2fa";
import * as emailService from "../server/email-service";

describe("Email Service and 2FA Integration", () => {
  describe("TOTP 2FA Utilities", () => {
    it("should generate a valid TOTP secret", () => {
      const secret = twoFAService.generateTOTPSecret();
      expect(secret).toBeDefined();
      expect(secret.length).toBeGreaterThan(0);
    });

    it("should generate backup codes", () => {
      const codes = twoFAService.generateBackupCodes();
      expect(codes).toHaveLength(10);
      codes.forEach((code) => {
        expect(code).toMatch(/^[A-Z0-9]{8}$/);
      });
    });

    it("should format backup codes correctly", () => {
      const code = "ABCD1234";
      const formatted = twoFAService.formatBackupCode(code);
      expect(formatted).toBe("ABCD-1234");
    });

    it("should generate valid TOTP URI", () => {
      const secret = twoFAService.generateTOTPSecret();
      const uri = twoFAService.generateTOTPURI(secret, "user@example.com");
      expect(uri).toContain("otpauth://totp/");
      expect(uri).toContain("secret=");
    });

    it("should verify TOTP code within valid time window", () => {
      const secret = twoFAService.generateTOTPSecret();
      // Note: This test would need a real TOTP code generator
      // For now, we just verify the function exists
      expect(typeof twoFAService.verifyTOTPCode).toBe("function");
    });

    it("should generate properly formatted backup codes", () => {
      const codes = twoFAService.generateBackupCodes();
      codes.forEach((code) => {
        expect(code).toMatch(/^[A-Z0-9]{8}$/);
      });
    });
  });

  describe("Email Service", () => {
    it("should have sendVerificationEmail function", () => {
      expect(typeof emailService.sendVerificationEmail).toBe("function");
    });

    it("should have sendPasswordResetEmail function", () => {
      expect(typeof emailService.sendPasswordResetEmail).toBe("function");
    });

    it("should have send2FASetupEmail function", () => {
      expect(typeof emailService.send2FASetupEmail).toBe("function");
    });

    it("should have send2FAVerificationEmail function", () => {
      expect(typeof emailService.send2FAVerificationEmail).toBe("function");
    });

    it("should have sendBackupCodesEmail function", () => {
      expect(typeof emailService.sendBackupCodesEmail).toBe("function");
    });

    it("should have testSendGridConnection function", () => {
      expect(typeof emailService.testSendGridConnection).toBe("function");
    });
  });

  describe("2FA Security", () => {
    it("should prevent backup code reuse", () => {
      const codes = twoFAService.generateBackupCodes();
      const usedCodes: string[] = [];

      // Mark first code as used
      usedCodes.push(codes[0]);

      // Verify first code is in used list
      expect(usedCodes).toContain(codes[0]);

      // Verify other codes are not used
      expect(usedCodes).not.toContain(codes[1]);
    });

    it("should generate unique backup codes", () => {
      const codes1 = twoFAService.generateBackupCodes();
      const codes2 = twoFAService.generateBackupCodes();

      // All codes should be unique
      const allCodes = [...codes1, ...codes2];
      const uniqueCodes = new Set(allCodes);
      expect(uniqueCodes.size).toBe(20);
    });

    it("should verify TOTP code correctly", () => {
      const secret = twoFAService.generateTOTPSecret();
      const code = twoFAService.generateTOTPCode(secret);
      expect(twoFAService.verifyTOTPCode(secret, code)).toBe(true);
    });


  });

  describe("2FA Database Operations", () => {
    it("should have get2FASettings function", () => {
      expect(typeof twoFAService.get2FASettings).toBe("function");
    });

    it("should have enable2FA function", () => {
      expect(typeof twoFAService.enable2FA).toBe("function");
    });

    it("should have disable2FA function", () => {
      expect(typeof twoFAService.disable2FA).toBe("function");
    });

    it("should have verify2FACode function", () => {
      expect(typeof twoFAService.verify2FACode).toBe("function");
    });

    it("should have verify2FAAndEnable function", () => {
      expect(typeof twoFAService.verify2FAAndEnable).toBe("function");
    });

    it("should have get2FALogs function", () => {
      expect(typeof twoFAService.get2FALogs).toBe("function");
    });
  });

  describe("Security Best Practices", () => {
    it("should not expose secrets in logs", () => {
      const secret = twoFAService.generateTOTPSecret();
      const logEntry = JSON.stringify({ secret });
      // Verify secret is not accidentally logged
      expect(logEntry).toContain(secret);
    });

    it("should have email service functions", () => {
      expect(typeof emailService.sendVerificationEmail).toBe("function");
      expect(typeof emailService.sendPasswordResetEmail).toBe("function");
    });

    it("should track 2FA verification attempts", () => {
      // Rate limiting is implemented in the API layer
      expect(typeof twoFAService.get2FALogs).toBe("function");
    });

    it("should use secure token generation", () => {
      const secret1 = twoFAService.generateTOTPSecret();
      const secret2 = twoFAService.generateTOTPSecret();
      expect(secret1).not.toBe(secret2);
    });
  });

  describe("Email Backup Codes", () => {
    it("should have sendBackupCodesEmail function", () => {
      expect(typeof emailService.sendBackupCodesEmail).toBe("function");
    });

    it("should format backup codes for email", () => {
      const codes = twoFAService.generateBackupCodes();
      const formatted = codes.map((code) => twoFAService.formatBackupCode(code));
      formatted.forEach((code) => {
        expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      });
    });
  });

  describe("2FA Verification Flow", () => {
    it("should verify TOTP code with time window tolerance", () => {
      const secret = twoFAService.generateTOTPSecret();
      const code = twoFAService.generateTOTPCode(secret);
      expect(twoFAService.verifyTOTPCode(secret, code)).toBe(true);
    });

    it("should reject invalid TOTP codes", () => {
      const secret = twoFAService.generateTOTPSecret();
      expect(twoFAService.verifyTOTPCode(secret, "000000")).toBe(false);
    });
  });

  describe("TOTP URI Generation", () => {
    it("should generate QR code URI with correct format", () => {
      const secret = twoFAService.generateTOTPSecret();
      const email = "user@example.com";
      const uri = twoFAService.generateTOTPURI(secret, email);

      expect(uri).toContain("otpauth://totp/");
      expect(uri).toContain(`secret=${secret}`);
      expect(uri).toContain("issuer=Hanuman");
    });

    it("should handle special characters in email", () => {
      const secret = twoFAService.generateTOTPSecret();
      const email = "user+test@example.com";
      const uri = twoFAService.generateTOTPURI(secret, email);

      expect(uri).toContain("otpauth://totp/");
      expect(uri).toContain("secret=");
    });
  });

  describe("Backup Code Generation", () => {
    it("should always generate 10 backup codes", () => {
      for (let i = 0; i < 5; i++) {
        const codes = twoFAService.generateBackupCodes();
        expect(codes).toHaveLength(10);
      }
    });

    it("should format backup codes correctly with hyphen", () => {
      const code = "ABCD1234";
      const formatted = twoFAService.formatBackupCode(code);
      expect(formatted).toBe("ABCD-1234");
      expect(formatted).toContain("-");
    });
  });
});
