import axios from 'axios';
import logger from './logger.js';

/**
 * Calculates the Haversine distance between two coordinates in kilometers.
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

/**
 * Searches for nearby hospitals using Google Places API (New)
 */
export const searchNearbyHospitals = async (lat, lng, radiusMeters = 10000) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      logger.warn('Google Maps API key is missing. Cannot search nearby hospitals.');
      return [];
    }

    const payload = {
      includedTypes: ["hospital"],
      maxResultCount: 10,
      rankPreference: "DISTANCE",
      locationRestriction: {
        circle: {
          center: {
            latitude: parseFloat(lat),
            longitude: parseFloat(lng)
          },
          radius: radiusMeters
        }
      }
    };

    const response = await axios.post('https://places.googleapis.com/v1/places:searchNearby', payload, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.businessStatus'
      }
    });

    if (response.data && response.data.places) {
      return response.data.places.map(place => {
        const hLat = place.location?.latitude;
        const hLng = place.location?.longitude;
        let distKm = 0;
        if (hLat && hLng) {
          distKm = calculateDistance(lat, lng, hLat, hLng);
        }
        
        return {
          id: place.id,
          name: place.displayName?.text || 'Unknown Hospital',
          address: place.formattedAddress || 'Address unavailable',
          lat: hLat,
          lng: hLng,
          distance: distKm ? `${distKm.toFixed(1)} km` : '',
          googleMapsUri: place.googleMapsUri,
          status: place.businessStatus
        };
      });
    }
    return [];
  } catch (error) {
    logger.error(`Error fetching from Google Places API: ${error.message}`);
    return [];
  }
};
