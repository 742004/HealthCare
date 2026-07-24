/**
 * Application Constants
 * Centralizes all magic strings, enums, and default configurations used across the backend.
 * Objects are frozen to prevent accidental modification during runtime.
 */

export const USER_ROLES = Object.freeze({
  ADMIN: 'SuperAdmin',
  PATIENT: 'Patient',
  DOCTOR: 'Doctor',
  HOSPITAL_ADMIN: 'HospitalAdmin',
  AMBULANCE_DRIVER: 'Driver',
});

export const EMERGENCY_STATUS = Object.freeze({
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  AMBULANCE_ASSIGNED: 'Ambulance Assigned',
  DRIVER_EN_ROUTE: 'En Route',
  PATIENT_PICKED: 'In Transit',
  HOSPITAL_NOTIFIED: 'Hospital Notified',
  ARRIVED_AT_HOSPITAL: 'Arrived',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
});

export const EMERGENCY_SEVERITY = Object.freeze({
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
});

export const AMBULANCE_STATUS = Object.freeze({
  AVAILABLE: 'Available',
  ASSIGNED: 'Assigned',
  ON_ROUTE: 'On Route',
  BUSY: 'Busy',
  MAINTENANCE: 'Maintenance',
  OFFLINE: 'Off Duty',
});

export const BED_TYPES = Object.freeze({
  GENERAL: 'General',
  ICU: 'ICU',
  NICU: 'NICU',
  PICU: 'PICU',
  EMERGENCY: 'Emergency',
  VENTILATOR: 'Ventilator',
});

export const NOTIFICATION_TYPES = Object.freeze({
  EMAIL: 'Email',
  SMS: 'SMS',
  PUSH: 'Push',
  IN_APP: 'In-App',
});

export const NOTIFICATION_EVENTS = Object.freeze({
  EMERGENCY_CREATED: 'EMERGENCY_CREATED',
  EMERGENCY_ACCEPTED: 'EMERGENCY_ACCEPTED',
  AMBULANCE_ASSIGNED: 'AMBULANCE_ASSIGNED',
  DRIVER_ARRIVED: 'DRIVER_ARRIVED',
  HOSPITAL_READY: 'HOSPITAL_READY',
  PATIENT_ADMITTED: 'PATIENT_ADMITTED',
  EMERGENCY_COMPLETED: 'EMERGENCY_COMPLETED',
});

export const JWT_CONSTANTS = Object.freeze({
  ACCESS_TOKEN_EXPIRY: process.env.JWT_EXPIRE || '15m',
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRE || '7d',
});

export const API_CONSTANTS = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  API_VERSION: 'v1',
});

export const VALIDATION_CONSTANTS = Object.freeze({
  PASSWORD_MIN_LENGTH: 8,
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: 10,
  MAX_LOGIN_ATTEMPTS: 5,
});
