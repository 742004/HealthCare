import nodemailer from 'nodemailer';
import { ApiError } from './ApiError.js';

/**
 * Configure the SMTP Transporter using Environment Variables
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Setting a pool size and timeout for production stability
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  connectionTimeout: 10000, // 10 seconds
});

/**
 * Verify SMTP connection on server startup
 */
transporter.verify((error, success) => {
  if (error) {
    console.warn('⚠️ SMTP Connection Failed. Check SMTP_ variables in .env:', error.message);
  } else {
    console.log('📧 SMTP Server Ready for messages');
  }
});

/**
 * Base HTML Template Wrapper
 * Ensures a consistent, professional layout across all emails.
 */
const buildTemplate = (title, content, expirationNotice = '') => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px; border: 1px solid #e9ecef;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #E63946; margin: 0;">Emergency Healthcare</h1>
      <p style="color: #1D3557; font-size: 14px; margin-top: 5px;">Connecting you to care, instantly.</p>
    </div>
    
    <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      <h2 style="color: #1D3557; border-bottom: 2px solid #f1faee; padding-bottom: 10px;">${title}</h2>
      <div style="color: #333333; line-height: 1.6; font-size: 16px;">
        ${content}
      </div>
      ${expirationNotice ? `<p style="color: #E63946; font-size: 13px; font-weight: bold; margin-top: 20px;">${expirationNotice}</p>` : ''}
    </div>
    
    <div style="text-align: center; margin-top: 30px; color: #6c757d; font-size: 12px;">
      <p>&copy; ${new Date().getFullYear()} Emergency Healthcare Connector. All rights reserved.</p>
      <p>Need help? Contact support at support@emergencyhealthcare.com</p>
    </div>
  </div>
`;

/**
 * Core send method with Retry mechanism
 */
const sendMailWithRetry = async (mailOptions, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Message sent successfully: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error(`Attempt ${i + 1} to send email failed: ${error.message}`);
      if (i === retries - 1) {
        throw new ApiError(500, 'Failed to send email after multiple attempts', 'EMAIL_SEND_FAILED');
      }
      // Wait 1 second before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};

// ============================================================================
// SPECIFIC EMAIL FUNCTIONS
// ============================================================================

export const sendOTPEmail = async (to, otp, minutesValid = 10) => {
  const content = `<p>Your One-Time Password (OTP) for login verification is:</p>
                   <h1 style="font-size: 32px; letter-spacing: 5px; color: #1D3557; text-align: center;">${otp}</h1>`;
  
  const mailOptions = {
    from: `"Emergency Healthcare" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Your Login OTP',
    html: buildTemplate('OTP Verification', content, `This code expires in ${minutesValid} minutes. Do not share it.`),
  };
  return sendMailWithRetry(mailOptions);
};

export const sendVerificationEmail = async (to, verificationUrl) => {
  const content = `<p>Welcome to the platform! Please verify your email address to activate your account.</p>
                   <div style="text-align: center; margin: 30px 0;">
                     <a href="${verificationUrl}" style="background-color: #2A9D8F; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
                   </div>
                   <p style="font-size: 12px; color: #666;">Or paste this link into your browser:<br>${verificationUrl}</p>`;
  
  const mailOptions = {
    from: `"Emergency Healthcare" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Verify Your Email',
    html: buildTemplate('Account Verification', content, 'This link expires in 24 hours.'),
  };
  return sendMailWithRetry(mailOptions);
};

export const sendPasswordResetEmail = async (to, resetUrl) => {
  const content = `<p>We received a request to reset your password.</p>
                   <div style="text-align: center; margin: 30px 0;">
                     <a href="${resetUrl}" style="background-color: #E63946; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                   </div>
                   <p>If you didn't request this, please ignore this email.</p>`;
                   
  const mailOptions = {
    from: `"Emergency Healthcare Security" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Password Reset Request',
    html: buildTemplate('Reset Password', content, 'This link expires in 1 hour.'),
  };
  return sendMailWithRetry(mailOptions);
};

export const sendWelcomeEmail = async (to, name) => {
  const content = `<p>Hi ${name},</p>
                   <p>Welcome to the Emergency Healthcare Connector. We are glad to have you on board.</p>
                   <p>You can now configure your profile, add emergency contacts, and be ready in case you ever need rapid assistance.</p>`;
                   
  const mailOptions = {
    from: `"Emergency Healthcare" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Welcome to Emergency Healthcare Connector',
    html: buildTemplate('Welcome Aboard!', content),
  };
  return sendMailWithRetry(mailOptions);
};

export const sendEmergencyConfirmation = async (to, emergencyId, hospitalName) => {
  const content = `<p>Your SOS request <strong>#${emergencyId}</strong> has been confirmed.</p>
                   <p>You are being directed to <strong>${hospitalName}</strong>.</p>
                   <p>An ambulance has been dispatched and you can track it live via your dashboard.</p>`;
                   
  const mailOptions = {
    from: `"Emergency Response" <${process.env.SMTP_USER}>`,
    to,
    subject: `SOS Confirmed: #${emergencyId}`,
    html: buildTemplate('Emergency Dispatched', content),
  };
  return sendMailWithRetry(mailOptions);
};

export const sendAmbulanceAssignedEmail = async (to, vehicleNo, driverName, eta) => {
  const content = `<p>An ambulance is on the way to your location.</p>
                   <ul>
                     <li><strong>Vehicle Number:</strong> ${vehicleNo}</li>
                     <li><strong>Driver:</strong> ${driverName}</li>
                     <li><strong>Estimated ETA:</strong> ${eta} minutes</li>
                   </ul>`;
                   
  const mailOptions = {
    from: `"Emergency Response" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Ambulance Assigned',
    html: buildTemplate('Ambulance En Route', content),
  };
  return sendMailWithRetry(mailOptions);
};

export const sendHospitalAdmissionEmail = async (to, patientName, hospitalName) => {
  const content = `<p>We are notifying you that <strong>${patientName}</strong> has safely arrived at <strong>${hospitalName}</strong>.</p>
                   <p>The triage team is currently attending to the patient.</p>`;
                   
  const mailOptions = {
    from: `"Emergency Response" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Patient Arrived at Hospital',
    html: buildTemplate('Arrival Confirmation', content),
  };
  return sendMailWithRetry(mailOptions);
};
