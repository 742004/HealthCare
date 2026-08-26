import { Client } from '@googlemaps/google-maps-services-js';
import { mapsConfig } from '../config/maps.config.js';
import { MapsProvider } from './maps.provider.js';
import logger from '../utils/logger.js';

/**
 * Google Maps Provider Implementation
 * 
 * Implements the MapsProvider interface using the official Google Maps SDK.
 */
export class GoogleMapsProvider extends MapsProvider {
  constructor() {
    super();
    if (!mapsConfig.googleMaps.apiKey) {
      logger?.warn('Google Maps API Key is missing. Maps features will fail.');
    }
    this.client = new Client({});
    this.key = mapsConfig.googleMaps.apiKey;
    this.timeout = mapsConfig.googleMaps.timeout;
  }

  async healthCheck() {
    try {
      // Perform a lightweight geocode to verify key
      await this.client.geocode({
        params: { address: '1600 Amphitheatre Parkway, Mountain View, CA', key: this.key },
        timeout: this.timeout,
      });
      return true;
    } catch (error) {
      logger?.error(`[GoogleMaps] healthCheck() failed: ${error.message}`);
      return false;
    }
  }

  async geocode(address) {
    try {
      const response = await this.client.geocode({
        params: { address, key: this.key },
        timeout: this.timeout,
      });
      return response.data.results;
    } catch (error) {
      logger?.error(`[GoogleMaps] geocode() failed: ${error.message}`);
      throw error;
    }
  }

  async reverseGeocode(lat, lng) {
    try {
      const response = await this.client.reverseGeocode({
        params: { latlng: `${lat},${lng}`, key: this.key },
        timeout: this.timeout,
      });
      return response.data.results;
    } catch (error) {
      logger?.error(`[GoogleMaps] reverseGeocode() failed: ${error.message}`);
      throw error;
    }
  }

  async getDirections(origin, destination, options = {}) {
    try {
      const response = await this.client.directions({
        params: {
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          key: this.key,
          mode: options.mode || 'driving',
          traffic_model: 'best_guess',
          departure_time: 'now'
        },
        timeout: this.timeout,
      });
      return response.data.routes;
    } catch (error) {
      logger?.error(`[GoogleMaps] getDirections() failed: ${error.message}`);
      throw error;
    }
  }

  async calculateDistance(origin, destination) {
    try {
      const response = await this.client.distancematrix({
        params: {
          origins: [`${origin.lat},${origin.lng}`],
          destinations: [`${destination.lat},${destination.lng}`],
          key: this.key,
          mode: 'driving'
        },
        timeout: this.timeout,
      });
      return response.data;
    } catch (error) {
      logger?.error(`[GoogleMaps] calculateDistance() failed: ${error.message}`);
      throw error;
    }
  }

  async searchPlaces(query, location, radius = mapsConfig.googleMaps.defaultRadius) {
    try {
      const response = await this.client.placesNearby({
        params: {
          location: `${location.lat},${location.lng}`,
          radius,
          keyword: query,
          key: this.key,
        },
        timeout: this.timeout,
      });
      return response.data.results;
    } catch (error) {
      logger?.error(`[GoogleMaps] searchPlaces() failed: ${error.message}`);
      throw error;
    }
  }

  // Domain specific aliases mapping to searchPlaces
  async findNearbyHospitals(lat, lng, radius) {
    return this.searchPlaces('hospital', { lat, lng }, radius);
  }

  async findNearbyAmbulances(lat, lng, radius) {
    // Note: In reality, ambulances are found via MongoDB geospatial queries, 
    // but this serves external API integration if needed.
    return this.searchPlaces('ambulance service', { lat, lng }, radius);
  }

  async findNearbyDoctors(lat, lng, radius) {
    return this.searchPlaces('doctor', { lat, lng }, radius);
  }
}
