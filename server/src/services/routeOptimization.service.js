import mapsService from './maps.service.js';
import { etaUtils } from '../utils/eta.util.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

/**
 * Route Optimization Service
 * 
 * Wraps MapsService to specifically handle routing, ETAs, and multi-stop optimization.
 */
class RouteOptimizationService {

  async optimizeRoute(origin, destination, waypoints = []) {
    try {
      // In a more complex setup, Google Maps Directions API supports `optimize:true` for waypoints
      const options = { mode: 'driving' };
      const routes = await mapsService.getDirections(origin, destination, options);
      if (!routes || routes.length === 0) {
        throw new ApiError(404, 'No route found');
      }
      return routes[0]; // return best route
    } catch (error) {
      logger?.error(`RouteOptimization optimizeRoute failed: ${error.message}`);
      throw new ApiError(500, 'Route optimization failed');
    }
  }

  async estimateTravelTime(origin, destination) {
    return mapsService.calculateETA(origin, destination);
  }

  async estimateArrival(origin, destination) {
    const duration = await this.estimateTravelTime(origin, destination);
    // duration.value is in seconds
    return etaUtils.calculateArrivalTime(duration.value);
  }

  async calculateShortestRoute(origin, destinations) {
    try {
      // Sends a distance matrix request from 1 origin to N destinations
      // to find the absolute closest one (e.g., closest hospital)
      const matrix = await mapsService.provider.client.distancematrix({
        params: {
          origins: [`${origin.lat},${origin.lng}`],
          destinations: destinations.map(d => `${d.lat},${d.lng}`),
          key: mapsService.provider.key,
          mode: 'driving'
        },
        timeout: mapsService.provider.timeout,
      });

      const elements = matrix.data.rows[0].elements;
      let shortestIndex = -1;
      let minDistance = Infinity;

      elements.forEach((el, index) => {
        if (el.status === 'OK' && el.distance.value < minDistance) {
          minDistance = el.distance.value;
          shortestIndex = index;
        }
      });

      if (shortestIndex === -1) {
        throw new ApiError(404, 'No reachable destinations found');
      }

      return {
        destinationIndex: shortestIndex,
        destination: destinations[shortestIndex],
        distance: elements[shortestIndex].distance,
        duration: elements[shortestIndex].duration
      };
    } catch (error) {
      logger?.error(`calculateShortestRoute failed: ${error.message}`);
      throw new ApiError(500, 'Failed to calculate shortest route');
    }
  }
}

export default new RouteOptimizationService();
