const nodemailer = require("nodemailer");

let transporter = null;
let isConfigured = false;

// Validate SMTP environment variables
function validateSMTPEnv() {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const missing = required.filter(key => !process.env[key]);
  
  // Check for MAIL_FROM or SMTP_FROM
  const fromVar = process.env.MAIL_FROM || process.env.SMTP_FROM;
  if (!fromVar) {
    missing.push('MAIL_FROM');
  }
  
  if (missing.length > 0) {
    console.error("❌ SMTP ENV MISSING:", missing.join(', '));
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`SMTP environment variables missing: ${missing.join(', ')}`);
    }
    
    return false;
  }
  
  console.log("✅ SMTP environment variables loaded");
  return true;
}

// Create nodemailer transporter with dynamic secure setting
function createTransporter() {
  if (!validateSMTPEnv()) {
    isConfigured = false;
    return null;
  }

  try {
    const port = Number(process.env.SMTP_PORT);
    const secure = port === 465; // true for 465, false for other ports
    
    transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: port,
      secure: secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    
    isConfigured = true;
    console.log(`📧 Mailer configured: ${process.env.SMTP_HOST}:${port} (secure: ${secure})`);
    return transporter;
  } catch (error) {
    console.error("❌ MAILER CREATE ERROR:", error.message);
    isConfigured = false;
    return null;
  }
}

// Verify SMTP connection
async function verifySmtp() {
  if (!isConfigured || !transporter) {
    console.error("❌ SMTP NOT CONFIGURED - cannot verify");
    return false;
  }

  try {
    await transporter.verify();
    console.log("✅ SMTP READY");
    return true;
  } catch (error) {
    console.error("❌ SMTP VERIFY FAILED:", error.message);
    return false;
  }
}

// Send email with flexible parameters
async function sendMail({ to, subject, text, html }) {
  const transporter = getTransporter();
  
  if (!isConfigured || !transporter) {
    console.error("❌ SMTP NOT CONFIGURED - cannot send email to", to);
    return { success: false, error: 'SMTP service not configured' };
  }

  const fromAddress = process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER;
  
  console.log(`📧 Sending email -> to:${to} from:${fromAddress} subject:${subject}`);

  const mailOptions = {
    from: fromAddress,
    to: to,
    subject: subject,
    text: text,
    html: html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    // Check for rejected emails
    if (info.rejected && info.rejected.length > 0) {
      console.error(`❌ Email rejected for ${to}:`, info.rejected);
      return { success: false, error: 'Email rejected by server', rejected: info.rejected };
    }
    
    console.log(`✅ Email sent successfully to ${to}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📧 Accepted: ${info.accepted ? info.accepted.join(', ') : 'none'}`);
    
    return { success: true, info };
  } catch (error) {
    console.error(`❌ Email send failed for ${to}:`, {
      code: error.code,
      response: error.response || 'No response',
      message: error.message
    });
    
    return { success: false, error: error.message, code: error.code };
  }
}

// Get transporter for sending emails
function getTransporter() {
  return transporter;
}

// Check if mailer is configured
function isMailerConfigured() {
  return isConfigured;
}

// Initialize mailer
function initializeMailer() {
  createTransporter();
}

module.exports = {
  initializeMailer,
  verifySmtp,
  sendMail,
  getTransporter,
  isMailerConfigured,
};
