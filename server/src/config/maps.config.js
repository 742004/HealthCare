import dotenv from 'dotenv';

dotenv.config();

/**
 * Google Maps Configuration Module
 * Exports immutable maps settings loaded from environment variables.
 */
export const mapsConfig = Object.freeze({
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    timeout: parseInt(process.env.MAPS_TIMEOUT, 10) || 5000,
    cacheTtl: parseInt(process.env.MAPS_CACHE_TTL, 10) || 3600, // Default 1 hour
    defaultRadius: parseInt(process.env.DEFAULT_RADIUS, 10) || 5000, // 5km
    defaultCountry: process.env.DEFAULT_COUNTRY || 'US',
  },
});
