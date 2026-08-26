/**
 * Abstract Maps Provider
 * 
 * Defines the contract that any Map provider (Google Maps, Mapbox, OpenStreetMap) must implement.
 * Ensures the application is decoupled from the specific mapping vendor.
 */
export class MapsProvider {
  async healthCheck() {
    throw new Error('Method "healthCheck()" must be implemented.');
  }

  async geocode(address) {
    throw new Error('Method "geocode()" must be implemented.');
  }

  async reverseGeocode(lat, lng) {
    throw new Error('Method "reverseGeocode()" must be implemented.');
  }

  async getDirections(origin, destination, options = {}) {
    throw new Error('Method "getDirections()" must be implemented.');
  }

  async calculateDistance(origin, destination) {
    throw new Error('Method "calculateDistance()" must be implemented.');
  }

  async findNearbyHospitals(lat, lng, radius) {
    throw new Error('Method "findNearbyHospitals()" must be implemented.');
  }

  async findNearbyAmbulances(lat, lng, radius) {
    throw new Error('Method "findNearbyAmbulances()" must be implemented.');
  }

  async findNearbyDoctors(lat, lng, radius) {
    throw new Error('Method "findNearbyDoctors()" must be implemented.');
  }

  async searchPlaces(query, location, radius) {
    throw new Error('Method "searchPlaces()" must be implemented.');
  }
}
