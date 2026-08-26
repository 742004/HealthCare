import { GoogleMapsProvider } from '../providers/googleMaps.provider.js';
import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';

/**
 * Maps Service
 * 
 * Orchestrates spatial search, geocoding, and distance calculations.
 */
class MapsService {
  constructor() {
    this.provider = new GoogleMapsProvider();
  }

  async getCoordinates(address) {
    try {
      const results = await this.provider.geocode(address);
      if (!results || results.length === 0) {
        throw new ApiError(404, 'Address could not be found');
      }
      return results[0].geometry.location;
    } catch (error) {
      logger?.error(`MapsService getCoordinates failed: ${error.message}`);
      throw new ApiError(500, 'Geocoding failed');
    }
  }

  async getAddress(lat, lng) {
    try {
      const results = await this.provider.reverseGeocode(lat, lng);
      if (!results || results.length === 0) {
        throw new ApiError(404, 'Coordinates could not be mapped to an address');
      }
      return results[0].formatted_address;
    } catch (error) {
      logger?.error(`MapsService getAddress failed: ${error.message}`);
      throw new ApiError(500, 'Reverse geocoding failed');
    }
  }

  async getDirections(origin, destination, options) {
    try {
      return await this.provider.getDirections(origin, destination, options);
    } catch (error) {
      throw new ApiError(500, 'Failed to fetch directions');
    }
  }

  async calculateDistance(origin, destination) {
    try {
      return await this.provider.calculateDistance(origin, destination);
    } catch (error) {
      throw new ApiError(500, 'Failed to calculate distance');
    }
  }

  async calculateETA(origin, destination) {
    try {
      const distanceMatrix = await this.calculateDistance(origin, destination);
      const element = distanceMatrix.rows[0].elements[0];
      if (element.status !== 'OK') {
        throw new ApiError(400, 'Cannot calculate ETA for these locations');
      }
      return element.duration; // { text: '15 mins', value: 900 }
    } catch (error) {
      throw new ApiError(500, 'Failed to calculate ETA');
    }
  }

  async findNearbyHospitals(lat, lng, radius) {
    return this.provider.findNearbyHospitals(lat, lng, radius);
  }

  async findNearestHospital(lat, lng, radius) {
    const hospitals = await this.findNearbyHospitals(lat, lng, radius);
    if (!hospitals || hospitals.length === 0) return null;
    return hospitals[0]; // the Google Maps API generally sorts by prominence/distance depending on search type
  }

  async findNearbyAmbulances(lat, lng, radius) {
    return this.provider.findNearbyAmbulances(lat, lng, radius);
  }

  async findNearestAmbulance(lat, lng, radius) {
    const ambulances = await this.findNearbyAmbulances(lat, lng, radius);
    return ambulances && ambulances.length > 0 ? ambulances[0] : null;
  }

  async findNearbyDoctors(lat, lng, radius) {
    return this.provider.findNearbyDoctors(lat, lng, radius);
  }

  async findNearestDoctor(lat, lng, radius) {
    const doctors = await this.findNearbyDoctors(lat, lng, radius);
    return doctors && doctors.length > 0 ? doctors[0] : null;
  }

  async searchNearbyPlaces(query, lat, lng, radius) {
    return this.provider.searchPlaces(query, { lat, lng }, radius);
  }
}

export default new MapsService();
