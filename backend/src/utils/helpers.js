import crypto from 'crypto';
import mongoose from 'mongoose';

/**
 * Generates a numeric One-Time Password of specified length.
 * @param {number} length 
 * @returns {string} Numeric OTP
 */
export const generateOTP = (length = 6) => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
};

/**
 * Generates a cryptographically secure random alphanumeric string.
 * @param {number} length 
 * @returns {string} Random string
 */
export const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
};

/**
 * Calculates distance between two Geo-coordinates using the Haversine formula.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Extremely basic ETA calculation assuming 40 km/h average city speed.
 * (Will be replaced by Google Maps API in real usage)
 * @param {number} distanceKm 
 * @returns {number} ETA in minutes
 */
export const calculateETA = (distanceKm) => {
  const averageSpeedKmph = 40; 
  return Math.ceil((distanceKm / averageSpeedKmph) * 60);
};

/**
 * Formats a Date object into a readable string (YYYY-MM-DD)
 * @param {Date|string} date 
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Strips all non-numeric characters from a phone number string.
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

/**
 * Basic string sanitization to prevent simplistic XSS or injections.
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/[<>]/g, '').trim();
};

/**
 * Converts a string to a URL-friendly slug.
 */
export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[^\w-]+/g, '')    // Remove all non-word chars
    .replace(/--+/g, '-');      // Replace multiple - with single -
};

/**
 * Normalizes query pagination parameters.
 */
export const paginate = (page = 1, limit = 20) => {
  const parsedPage = parseInt(page, 10) || 1;
  const parsedLimit = parseInt(limit, 10) || 20;
  const safeLimit = parsedLimit > 100 ? 100 : parsedLimit;
  return {
    skip: (parsedPage - 1) * safeLimit,
    limit: safeLimit,
    page: parsedPage
  };
};

/**
 * Builds the meta object for standardized API pagination responses.
 */
export const buildPaginationMeta = (totalRecords, page, limit) => {
  return {
    total: totalRecords,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages: Math.ceil(totalRecords / limit),
  };
};

/**
 * Verifies if a string is a valid MongoDB ObjectId.
 */
export const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Masks an email for privacy (e.g. johndoe@gmail.com -> j***e@gmail.com)
 */
export const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
};

/**
 * Masks a phone number (e.g. +1234567890 -> +123****890)
 */
export const maskPhone = (phone) => {
  if (!phone || phone.length < 6) return phone;
  return phone.substring(0, 4) + '****' + phone.substring(phone.length - 3);
};

/**
 * Generates a unique reference ID (e.g., for Emergency Requests: EMR-ABC12)
 */
export const generateUniqueReference = (prefix = 'REF') => {
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${randomPart}`;
};
