/**
 * Geospatial Utilities
 * 
 * Helper functions for validating coordinates, bounding boxes, 
 * and formatting GeoJSON data.
 */

export const geoUtils = {
  isValidCoordinate(lat, lng) {
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    if (lat < -90 || lat > 90) return false;
    if (lng < -180 || lng > 180) return false;
    return true;
  },

  toGeoJSON(lat, lng) {
    if (!this.isValidCoordinate(lat, lng)) {
      throw new Error('Invalid coordinates');
    }
    return {
      type: 'Point',
      coordinates: [lng, lat], // GeoJSON requires [longitude, latitude]
    };
  },

  calculateBoundingBox(lat, lng, radiusKm) {
    // Simple bounding box calculation (approximation)
    const latDelta = radiusKm / 111.32;
    const lngDelta = radiusKm / (111.32 * Math.cos(lat * (Math.PI / 180)));
    return {
      minLat: lat - latDelta,
      maxLat: lat + latDelta,
      minLng: lng - lngDelta,
      maxLng: lng + lngDelta,
    };
  }
};
