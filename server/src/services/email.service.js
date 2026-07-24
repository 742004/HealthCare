import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import { sendEmail } from '../utils/sendEmail.js';

/**
 * ============================================================================
 * REPOSITORY PLACEHOLDERS
 * ============================================================================
 */
const EmailLogRepository = {
  createLog: async (data, session = null) => null,
  updateLogStatus: async (logId, status, session = null) => null,
  findFailedEmails: async () => [],
};

/**
 * ============================================================================
 * TEMPLATE MANAGEMENT & REGISTRY
 * Supports HTML, Plain Text, Variables, and Versioning.
 * ============================================================================
 */
const EMAIL_TEMPLATES = {
  v1: {
    WELCOME: {
      subject: 'Welcome to HEALIX, {{name}}!',
      html: '<h1>Welcome to HEALIX</h1><p>Hello {{name}}, your account is ready.</p>',
      text: 'Welcome to HEALIX, {{name}}. Your account is ready.'
    },
    EMAIL_VERIFICATION: {
      subject: 'Verify your HEALIX Email',
      html: '<p>Click <a href="{{link}}">here</a> to verify.</p>',
      text: 'Please navigate to {{link}} to verify your email.'
    },
    PASSWORD_RESET: {
      subject: 'Password Reset Request',
      html: '<p>Click <a href="{{link}}">here</a> to reset your password. Expires in 10 minutes.</p>',
      text: 'Navigate to {{link}} to reset your password.'
    },
    OTP: {
      subject: 'Your HEALIX OTP Code',
      html: '<h2>{{otp}}</h2><p>Do not share this code.</p>',
      text: 'Your OTP is {{otp}}. Do not share it.'
    },
    EMERGENCY_CONFIRMED: {
      subject: 'Emergency SOS Received - Ref: {{reference}}',
      html: '<p>Help is on the way. Keep calm.</p>',
      text: 'Help is on the way. Ref: {{reference}}'
    },
    AMBULANCE_ASSIGNED: {
      subject: 'Ambulance En Route',
      html: '<p>Vehicle {{ambulance}} is on its way. ETA: {{eta}}.</p>',
      text: 'Vehicle {{ambulance}} is on its way. ETA: {{eta}}.'
    },
    HOSPITAL_ASSIGNED: {
      subject: 'Hospital Prepared',
      html: '<p>{{hospital}} is preparing for your arrival.</p>',
      text: '{{hospital}} is preparing for your arrival.'
    },
    DOCTOR_ASSIGNED: {
      subject: 'Doctor Assigned',
      html: '<p>Dr. {{doctor}} is reviewing your case.</p>',
      text: 'Dr. {{doctor}} is reviewing your case.'
    },
    EMERGENCY_COMPLETED: {
      subject: 'Emergency Case Closed',
      html: '<p>Case {{reference}} has been successfully closed. We hope you are feeling better.</p>',
      text: 'Case {{reference}} has been successfully closed.'
    },
    MEDICAL_REPORT_AVAILABLE: {
      subject: 'New Medical Report Available',
      html: '<p>A new report has been uploaded to your profile by Dr. {{doctor}}.</p>',
      text: 'A new report has been uploaded to your profile by Dr. {{doctor}}.'
    },
    APPOINTMENT_REMINDER: {
      subject: 'Upcoming Appointment Reminder',
      html: '<p>You have an appointment on {{date}} at {{time}}.</p>',
      text: 'You have an appointment on {{date}} at {{time}}.'
    },
    ADMIN_BROADCAST: {
      subject: '{{subject}}',
      html: '<p>{{message}}</p>',
      text: '{{message}}'
    }
  }
};

/**
 * ============================================================================
 * EMAIL PROVIDER ADAPTERS
 * Abstracts Nodemailer, SendGrid, Amazon SES, Mailgun.
 * ============================================================================
 */
class BaseEmailProvider {
  async send(to, subject, html, text) { throw new Error('Not implemented'); }
}

class NodemailerProvider extends BaseEmailProvider {
  async send(to, subject, html, text) {
    // Utilizes the existing sendEmail utility internally
    await sendEmail({ email: to, subject, message: text, html });
    return true;
  }
}

// Support future providers (SendGridProvider, SESProvider, etc)
const emailProvider = new NodemailerProvider();

/**
 * Email Orchestration Service
 * Pure business logic for managing, templating, and delivering emails safely.
 */
class EmailService {
  /**
   * ============================================================================
   * ANALYTICS & TRACKING HOOKS
   * Tracking states: QUEUED, SENT, DELIVERED, OPENED, CLICKED, FAILED, BOUNCED
   * ============================================================================
   */
  async _recordDelivery(logId) { await EmailLogRepository.updateLogStatus(logId, 'DELIVERED'); }
  async _recordOpen(logId) { await EmailLogRepository.updateLogStatus(logId, 'OPENED'); }
  async _recordClick(logId) { await EmailLogRepository.updateLogStatus(logId, 'CLICKED'); }
  async _recordBounce(logId) { await EmailLogRepository.updateLogStatus(logId, 'BOUNCED'); }

  /**
   * Evaluates templates and injects dynamic data variables.
   * @private
   */
  _compileTemplate(templateKey, variables, version = 'v1') {
    const template = EMAIL_TEMPLATES[version]?.[templateKey];
    if (!template) throw new Error(`Email template ${templateKey} not found in version ${version}.`);

    let compiledSubject = template.subject;
    let compiledHtml = template.html;
    let compiledText = template.text;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      compiledSubject = compiledSubject.replace(regex, value);
      compiledHtml = compiledHtml.replace(regex, value);
      compiledText = compiledText.replace(regex, value);
    }
    
    return { subject: compiledSubject, html: compiledHtml, text: compiledText };
  }

  /**
   * ============================================================================
   * QUEUE & SCHEDULING PLACEHOLDERS
   * ============================================================================
   */
  async _queueEmailJob(payload) {
    // Push to BullMQ or SQS
    const log = await EmailLogRepository.createLog({ ...payload, status: 'QUEUED' });
    return log?._id || 'mock-log-id';
  }

  async scheduleSend(to, templateKey, variables, sendAtDate) {
    logger.info(`[EMAIL] Scheduled ${templateKey} for ${to} at ${sendAtDate}`);
    return true;
  }

  /**
   * Internal Delivery Engine
   * @private
   */
  async _deliverEmail(to, compiledTemplate, logId) {
    try {
      await emailProvider.send(to, compiledTemplate.subject, compiledTemplate.html, compiledTemplate.text);
      await EmailLogRepository.updateLogStatus(logId, 'SENT');
      logger.debug(`[EMAIL] Sent successfully to ${to}`);
      return true;
    } catch (error) {
      await EmailLogRepository.updateLogStatus(logId, 'FAILED');
      logger.error(`[EMAIL] Delivery failed to ${to}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Primary method to send immediate templated emails.
   */
  async sendTemplatedEmail(to, templateKey, variables = {}, version = 'v1') {
    const compiled = this._compileTemplate(templateKey, variables, version);
    
    // Log intent to DB / Queue
    const logId = await this._queueEmailJob({ to, templateKey, version });

    // Attempt synchronous delivery (or let Queue Worker handle it in a real setup)
    await this._deliverEmail(to, compiled, logId);
    
    logger.info(`[AUDIT] Email (${templateKey}) sent to ${to}`);
    return true;
  }

  /**
   * Bulk dispatch for alerts (Admin Broadcasts).
   */
  async sendBulkEmail(toList, templateKey, variables = {}, version = 'v1') {
    logger.warn(`[AUDIT] Initiating Bulk Email (${templateKey}) to ${toList.length} recipients`);
    
    const chunks = [];
    for (const to of toList) {
      chunks.push(this.sendTemplatedEmail(to, templateKey, variables, version));
    }

    await Promise.allSettled(chunks);
    return true;
  }

  /**
   * Retry mechanism for failed emails.
   * Runs via Cron or Queue worker.
   */
  async retryFailedEmails() {
    const failedEmails = await EmailLogRepository.findFailedEmails();
    logger.info(`[WORKER] Found ${failedEmails.length} failed emails to retry.`);
    // Loop and retry...
    return true;
  }

  /**
   * Explicit convenience methods mapping to Business Categories
   */
  async sendWelcome(to, name) {
    return this.sendTemplatedEmail(to, 'WELCOME', { name });
  }

  async sendOTP(to, otpCode) {
    return this.sendTemplatedEmail(to, 'OTP', { otp: otpCode });
  }

  async sendPasswordReset(to, resetLink) {
    return this.sendTemplatedEmail(to, 'PASSWORD_RESET', { link: resetLink });
  }

  async sendAdminBroadcast(toList, subject, htmlMessage) {
    return this.sendBulkEmail(toList, 'ADMIN_BROADCAST', { subject, message: htmlMessage });
  }
}

export const emailService = new EmailService();
