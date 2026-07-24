import logger from '../utils/logger.js';
import { eventBus, DOMAIN_EVENTS } from '../core/EventBus.js';
import { realtimeGateway } from './gateway.js';
import { REALTIME_EVENTS } from './events.js';

/**
 * Tracking Gateway
 * Pure presentation/networking layer for broadcasting high-frequency GPS data.
 * Bridges internal EventBus location events to external WebSocket clients.
 * Strictly NO business logic or database access.
 */
class TrackingGateway {
  constructor() {
    this._initializeSubscriptions();
  }

  /**
   * Subscribes to internal business domain events via the centralized EventBus.
   * @private
   */
  _initializeSubscriptions() {
    // High-frequency GPS ticks
    eventBus.subscribe(DOMAIN_EVENTS.LOCATION_UPDATED, this._handleLocationUpdated.bind(this));
    
    // Lifecycle events that dictate when tracking starts or stops
    eventBus.subscribe(DOMAIN_EVENTS.AMBULANCE_ASSIGNED, this._handleTrackingLifecycle.bind(this));
    eventBus.subscribe(DOMAIN_EVENTS.PATIENT_PICKED, this._handleTrackingLifecycle.bind(this));
    eventBus.subscribe(DOMAIN_EVENTS.ARRIVED_AT_HOSPITAL, this._handleTrackingLifecycle.bind(this));
    
    logger.info('[TRACKING_GATEWAY] Successfully subscribed to EventBus domain events.');
  }

  /**
   * Helper to broadcast a GPS payload to all active tracking participants.
   * @private
   */
  async _broadcastLocation(payload) {
    const { emergency, coordinates } = payload;
    if (!emergency || !coordinates) return;

    try {
      // 1. Notify the patient directly (so they can see the ambulance approaching)
      if (emergency.patient) {
        await realtimeGateway.toUser(emergency.patient.toString(), REALTIME_EVENTS.LOCATION_UPDATED, payload);
      }

      // 2. Notify the assigned hospital (so the ER knows exactly how far away the patient is)
      if (emergency.assignedHospital) {
        await realtimeGateway.toRoom(`hospital:${emergency.assignedHospital}`, REALTIME_EVENTS.LOCATION_UPDATED, payload);
      }

      // 3. Notify the ambulance room (for internal tracking/fleet management sync)
      if (emergency.assignedAmbulance) {
        await realtimeGateway.toRoom(`ambulance:${emergency.assignedAmbulance}`, REALTIME_EVENTS.LOCATION_UPDATED, payload);
      }

      // 4. Globally notify the admin monitoring dashboard for city-wide fleet tracking
      await realtimeGateway.toRoom('admin_monitoring', REALTIME_EVENTS.LOCATION_UPDATED, payload);
      
    } catch (error) {
      // Use debug for high-frequency logs to prevent swamping the production log files on intermittent drops
      logger.debug(`[TRACKING_GATEWAY] Broadcast failed for LOCATION_UPDATED: ${error.message}`);
    }
  }

  /**
   * Handler: Triggered constantly (every few seconds) as ambulances drive.
   */
  async _handleLocationUpdated(payload) {
    // No business logic here (like checking if the ambulance is speeding)
    // Just blindly forward the coordinates to the interested clients.
    await this._broadcastLocation(payload);
  }

  /**
   * Handler: Triggered when an emergency transitions states to inform clients 
   * that tracking contexts have shifted (e.g. tracking is now active, or tracking has ended).
   */
  async _handleTrackingLifecycle(payload) {
    // Allows the frontend to snap the map bounds or clear tracking markers 
    // immediately when an ambulance arrives at the hospital.
    logger.debug('[TRACKING_GATEWAY] Broadcasting tracking lifecycle sync update.');
    
    // We can emit a specific sub-event or just reuse the standard event to force a map refresh
    await this._broadcastLocation(payload);
  }
}

export const trackingGateway = new TrackingGateway();
