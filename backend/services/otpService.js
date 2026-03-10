import crypto from "crypto";
import bcrypt from "bcryptjs";
import { BrevoClient } from "@getbrevo/brevo";

/**
 * Generate a cryptographically secure 6-digit OTP
 */
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Hash OTP using bcrypt for secure storage
 */
export const hashOTP = async (otp) => {
  return await bcrypt.hash(otp, 10);
};

/**
 * Verify OTP against stored hash
 */
export const verifyOTP = async (otp, hash) => {
  return await bcrypt.compare(otp, hash);
};

/**
 * Send OTP email via Brevo API
 */
export const sendOTPEmail = async (email, name, otp) => {
  const brevo = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY,
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 480px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1e3a5f, #2d6a4f); padding: 24px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 24px; letter-spacing: 1px; }
        .body { padding: 32px 24px; }
        .otp-box { background: #f0f9ff; border: 2px dashed #1e3a5f; border-radius: 8px; text-align: center; padding: 20px; margin: 24px 0; }
        .otp-code { font-size: 40px; font-weight: bold; letter-spacing: 10px; color: #1e3a5f; }
        .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>🔐 SecureStay</h1></div>
        <div class="body">
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your one-time password (OTP) for login is:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p>⏰ This OTP expires in <strong>5 minutes</strong>.</p>
          <p>⚠️ If you did not request this, please ignore this email and secure your account.</p>
        </div>
        <div class="footer">© ${new Date().getFullYear()} SecureStay. All rights reserved.</div>
      </div>
    </body>
    </html>
  `;

  try {
    await brevo.transactionalEmails.sendTransacEmail({
      subject: "SecureStay – Your Login OTP Code",
      htmlContent,
      textContent: `Your SecureStay OTP is: ${otp}. It expires in 5 minutes.`,
      sender: {
        name: "SecureStay",
        email: "tressiamaejusto36@gmail.com",
      },
      to: [{ email, name }],
    });
    console.log(`📧 OTP sent to ${email}`);
  } catch (error) {
    console.error("Brevo email error:", error?.response?.body || error.message);
    throw new Error("Failed to send OTP email. Please try again.");
  }
};
