const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const { sendMail } = require("../utils/mailer");

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Hash OTP for storage
async function hashOTP(otp) {
  return await bcrypt.hash(otp, 10);
}

// Verify OTP against hash
async function verifyOTP(otp, hash) {
  return await bcrypt.compare(otp, hash);
}

// Send OTP email
async function sendOTPEmail(email, otp) {
  const subject = "Email verification code";
  const text = `Your verification code is: ${otp}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333; margin-bottom: 10px;">Kutubxona Library</h1>
        <p style="color: #666; margin: 0;">Email Verification</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <p style="color: #333; font-size: 16px; margin-bottom: 15px;">Your verification code is:</p>
        <div style="background: #007bff; color: white; padding: 15px 25px; border-radius: 6px; display: inline-block;">
          <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; font-family: monospace;">${otp}</span>
        </div>
      </div>
      
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="color: #856404; margin: 0; font-size: 14px;">
          <strong>Important:</strong> This code will expire in <strong>5 minutes</strong>.
        </p>
      </div>
      
      <p style="color: #666; font-size: 14px; line-height: 1.5;">
        If you didn't request this verification code, please ignore this email. 
        Your account remains secure.
      </p>
      
      <hr style="border: 1px solid #eee; margin: 30px 0;">
      
      <div style="text-align: center; color: #999; font-size: 12px;">
        <p>This is an automated message from Kutubxona Library System.</p>
        <p>Sent from zoitovfirdavs3@gmail.com</p>
      </div>
    </div>
  `;

  const result = await sendMail({ to: email, subject, text, html });
  
  if (result.success) {
    console.log(`MAIL SENT: ${email} - Message ID: ${result.info?.messageId || 'N/A'}`);
  } else {
    console.log(`MAIL FAILED: ${email} - Error: ${result.error} - Code: ${result.code || 'N/A'}`);
  }
  
  return result;
}

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP,
  sendOTPEmail,
};
