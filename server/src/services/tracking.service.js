import { io } from '../realtime/gateway.js'; // Assuming realtime is set up and accessible
import { REALTIME_EVENTS } from '../realtime/events.js'; // Assuming standard events are defined
import logger from '../utils/logger.js';
import ApiError from '../utils/ApiError.js';

/**
 * Tracking Service
 * 
 * Orchestrates live location updates via Socket.IO for ambulances,
 * patients, and emergency scenarios.
 */
class TrackingService {

  async updateAmbulanceLocation(ambulanceId, coordinates, heading, speed) {
    try {
      // In a real scenario, we would also update the Ambulance document in MongoDB
      this.broadcastLiveLocation(`ambulance:${ambulanceId}`, {
        ambulanceId,
        coordinates,
        heading,
        speed,
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (error) {
      logger?.error(`TrackingService updateAmbulanceLocation failed: ${error.message}`);
      throw new ApiError(500, 'Failed to update ambulance location');
    }
  }

  async trackEmergency(emergencyId, data) {
    try {
      this.broadcastLiveLocation(`emergency:${emergencyId}`, {
        emergencyId,
        ...data,
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (error) {
      throw new ApiError(500, 'Failed to track emergency');
    }
  }

  async trackPatient(patientId, coordinates) {
    try {
      this.broadcastLiveLocation(`patient:${patientId}`, {
        patientId,
        coordinates,
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (error) {
      throw new ApiError(500, 'Failed to track patient');
    }
  }

  async trackHospital(hospitalId, data) {
    try {
      // Used to broadcast things like capacity changes
      this.broadcastLiveLocation(`hospital:${hospitalId}`, {
        hospitalId,
        ...data,
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (error) {
      throw new ApiError(500, 'Failed to track hospital updates');
    }
  }

  broadcastLiveLocation(room, data) {
    if (!io) {
      logger?.warn('Socket.IO is not initialized. Cannot broadcast location.');
      return;
    }
    // Using a generic LOCATION_UPDATED event as part of PRESENCE
    io.to(room).emit('REALTIME_EVENTS.PRESENCE.LOCATION_UPDATED', data);
  }
}

export default new TrackingService();
