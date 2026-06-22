import sgMail from "@sendgrid/mail";

// Initialize SendGrid with API key
const sendgridApiKey = process.env.SENDGRID_API_KEY;
if (sendgridApiKey) {
  sgMail.setApiKey(sendgridApiKey);
}

const SENDER_EMAIL = "noreply@hanumantennisacademy.com";
const SENDER_NAME = "Hanuman Tennis Academy";

// ============ EMAIL TEMPLATES ============

interface EmailVerificationData {
  email: string;
  username: string;
  verificationToken: string;
  verificationLink: string;
}

interface PasswordResetData {
  email: string;
  username: string;
  resetToken: string;
  resetLink: string;
}

interface TwoFactorSetupData {
  email: string;
  username: string;
  setupLink: string;
}

interface TwoFactorVerificationData {
  email: string;
  username: string;
  verificationCode: string;
}

// ============ EMAIL SENDING FUNCTIONS ============

/**
 * Send email verification email
 */
export async function sendVerificationEmail(data: EmailVerificationData): Promise<boolean> {
  if (!sendgridApiKey) {
    console.warn("[EmailService] SendGrid API key not configured");
    return false;
  }

  try {
    const htmlContent = `
      <h2>Welcome to Hanuman Tennis Academy!</h2>
      <p>Hi ${data.username},</p>
      <p>Thank you for registering. Please verify your email address to activate your account.</p>
      <p>
        <a href="${data.verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #0a7ea4; color: white; text-decoration: none; border-radius: 5px;">
          Verify Email
        </a>
      </p>
      <p>Or copy and paste this link in your browser:</p>
      <p>${data.verificationLink}</p>
      <p>This link will expire in 24 hours.</p>
      <hr />
      <p>If you didn't create this account, please ignore this email.</p>
    `;

    const msg = {
      to: data.email,
      from: { email: SENDER_EMAIL, name: SENDER_NAME },
      subject: "Verify Your Email - Hanuman Tennis Academy",
      html: htmlContent,
      text: `Welcome to Hanuman Tennis Academy!\n\nVerify your email: ${data.verificationLink}\n\nThis link expires in 24 hours.`,
    };

    await sgMail.send(msg);
    console.log(`[EmailService] Verification email sent to ${data.email}`);
    return true;
  } catch (error) {
    console.error("[EmailService] Failed to send verification email:", error);
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(data: PasswordResetData): Promise<boolean> {
  if (!sendgridApiKey) {
    console.warn("[EmailService] SendGrid API key not configured");
    return false;
  }

  try {
    const htmlContent = `
      <h2>Password Reset Request</h2>
      <p>Hi ${data.username},</p>
      <p>We received a request to reset your password. Click the link below to create a new password.</p>
      <p>
        <a href="${data.resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #0a7ea4; color: white; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
      </p>
      <p>Or copy and paste this link in your browser:</p>
      <p>${data.resetLink}</p>
      <p>This link will expire in 1 hour.</p>
      <hr />
      <p>If you didn't request a password reset, please ignore this email or contact support.</p>
    `;

    const msg = {
      to: data.email,
      from: { email: SENDER_EMAIL, name: SENDER_NAME },
      subject: "Reset Your Password - Hanuman Tennis Academy",
      html: htmlContent,
      text: `Password Reset Request\n\nReset your password: ${data.resetLink}\n\nThis link expires in 1 hour.`,
    };

    await sgMail.send(msg);
    console.log(`[EmailService] Password reset email sent to ${data.email}`);
    return true;
  } catch (error) {
    console.error("[EmailService] Failed to send password reset email:", error);
    return false;
  }
}

/**
 * Send 2FA setup email
 */
export async function send2FASetupEmail(data: TwoFactorSetupData): Promise<boolean> {
  if (!sendgridApiKey) {
    console.warn("[EmailService] SendGrid API key not configured");
    return false;
  }

  try {
    const htmlContent = `
      <h2>Two-Factor Authentication Setup</h2>
      <p>Hi ${data.username},</p>
      <p>You've enabled two-factor authentication on your account. This adds an extra layer of security.</p>
      <p>
        <a href="${data.setupLink}" style="display: inline-block; padding: 10px 20px; background-color: #0a7ea4; color: white; text-decoration: none; border-radius: 5px;">
          Complete 2FA Setup
        </a>
      </p>
      <p>Or copy and paste this link in your browser:</p>
      <p>${data.setupLink}</p>
      <p>From now on, you'll need to enter a code from your authenticator app when logging in.</p>
      <hr />
      <p>If you didn't enable 2FA, please contact support immediately.</p>
    `;

    const msg = {
      to: data.email,
      from: { email: SENDER_EMAIL, name: SENDER_NAME },
      subject: "Two-Factor Authentication Enabled - Hanuman Tennis Academy",
      html: htmlContent,
      text: `Two-Factor Authentication Setup\n\nComplete setup: ${data.setupLink}`,
    };

    await sgMail.send(msg);
    console.log(`[EmailService] 2FA setup email sent to ${data.email}`);
    return true;
  } catch (error) {
    console.error("[EmailService] Failed to send 2FA setup email:", error);
    return false;
  }
}

/**
 * Send 2FA verification code (for backup)
 */
export async function send2FAVerificationEmail(data: TwoFactorVerificationData): Promise<boolean> {
  if (!sendgridApiKey) {
    console.warn("[EmailService] SendGrid API key not configured");
    return false;
  }

  try {
    const htmlContent = `
      <h2>Two-Factor Authentication Code</h2>
      <p>Hi ${data.username},</p>
      <p>Your two-factor authentication code is:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; font-family: monospace;">
        ${data.verificationCode}
      </p>
      <p>This code is valid for 5 minutes.</p>
      <hr />
      <p>If you didn't request this code, please ignore this email.</p>
    `;

    const msg = {
      to: data.email,
      from: { email: SENDER_EMAIL, name: SENDER_NAME },
      subject: "Your 2FA Code - Hanuman Tennis Academy",
      html: htmlContent,
      text: `Your 2FA code: ${data.verificationCode}\n\nValid for 5 minutes.`,
    };

    await sgMail.send(msg);
    console.log(`[EmailService] 2FA verification email sent to ${data.email}`);
    return true;
  } catch (error) {
    console.error("[EmailService] Failed to send 2FA verification email:", error);
    return false;
  }
}

/**
 * Send backup codes email
 */
export async function sendBackupCodesEmail(
  email: string,
  username: string,
  backupCodes: string[]
): Promise<boolean> {
  if (!sendgridApiKey) {
    console.warn("[EmailService] SendGrid API key not configured");
    return false;
  }

  try {
    const codesHtml = backupCodes
      .map((code) => `<code style="font-family: monospace; background: #f0f0f0; padding: 2px 4px;">${code}</code>`)
      .join("<br />");

    const htmlContent = `
      <h2>Your 2FA Backup Codes</h2>
      <p>Hi ${username},</p>
      <p>Save these backup codes in a safe place. You can use them to access your account if you lose access to your authenticator app.</p>
      <p style="background: #f9f9f9; padding: 15px; border-left: 4px solid #0a7ea4; border-radius: 3px;">
        ${codesHtml}
      </p>
      <p><strong>Important:</strong> Each code can only be used once. Keep them safe and don't share them with anyone.</p>
      <hr />
      <p>If you didn't enable 2FA, please contact support immediately.</p>
    `;

    const msg = {
      to: email,
      from: { email: SENDER_EMAIL, name: SENDER_NAME },
      subject: "Your 2FA Backup Codes - Hanuman Tennis Academy",
      html: htmlContent,
      text: `Your backup codes:\n\n${backupCodes.join("\n")}\n\nKeep these safe!`,
    };

    await sgMail.send(msg);
    console.log(`[EmailService] Backup codes email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("[EmailService] Failed to send backup codes email:", error);
    return false;
  }
}

/**
 * Test SendGrid connection
 */
export async function testSendGridConnection(): Promise<boolean> {
  if (!sendgridApiKey) {
    console.warn("[EmailService] SendGrid API key not configured");
    return false;
  }

  try {
    const msg = {
      to: SENDER_EMAIL,
      from: { email: SENDER_EMAIL, name: SENDER_NAME },
      subject: "SendGrid Connection Test",
      text: "This is a test email to verify SendGrid connection.",
    };

    await sgMail.send(msg);
    console.log("[EmailService] SendGrid connection test successful");
    return true;
  } catch (error) {
    console.error("[EmailService] SendGrid connection test failed:", error);
    return false;
  }
}
