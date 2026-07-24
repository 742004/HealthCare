import logger from '../utils/logger.js';
import { eventBus, DOMAIN_EVENTS } from '../core/EventBus.js';
import { realtimeGateway } from './gateway.js';
import { REALTIME_EVENTS } from './events.js';

/**
 * Emergency Gateway
 * Pure presentation/networking layer connecting internal EventBus domain 
 * events to external WebSocket clients via the Realtime Gateway.
 * Strictly NO business logic or database access.
 */
class EmergencyGateway {
  constructor() {
    this._initializeSubscriptions();
  }

  /**
   * Subscribes to internal business domain events via the centralized EventBus.
   * @private
   */
  _initializeSubscriptions() {
    eventBus.subscribe(DOMAIN_EVENTS.EMERGENCY_CREATED, this._handleEmergencyCreated.bind(this));
    eventBus.subscribe(DOMAIN_EVENTS.AI_TRIAGE_COMPLETED, this._handleEmergencyUpdated.bind(this));
    eventBus.subscribe(DOMAIN_EVENTS.HOSPITAL_ASSIGNED, this._handleEmergencyUpdated.bind(this));
    eventBus.subscribe(DOMAIN_EVENTS.AMBULANCE_ASSIGNED, this._handleEmergencyUpdated.bind(this));
    eventBus.subscribe(DOMAIN_EVENTS.PATIENT_PICKED, this._handleEmergencyUpdated.bind(this));
    eventBus.subscribe(DOMAIN_EVENTS.ARRIVED_AT_HOSPITAL, this._handleEmergencyUpdated.bind(this));
    
    eventBus.subscribe(DOMAIN_EVENTS.EMERGENCY_COMPLETED, this._handleEmergencyCompleted.bind(this));
    eventBus.subscribe(DOMAIN_EVENTS.EMERGENCY_CANCELLED, this._handleEmergencyCancelled.bind(this));
    
    logger.info('[EMERGENCY_GATEWAY] Successfully subscribed to EventBus domain events.');
  }

  /**
   * Helper to broadcast an emergency update to all relevant active participants.
   * @private
   */
  async _broadcastToParticipants(event, payload) {
    const { emergency } = payload;
    if (!emergency) return;

    try {
      // Always notify the patient directly
      if (emergency.patient) {
        await realtimeGateway.toUser(emergency.patient.toString(), event, payload);
      }

      // Notify the assigned hospital room
      if (emergency.assignedHospital) {
        await realtimeGateway.toRoom(`hospital:${emergency.assignedHospital}`, event, payload);
      }

      // Notify the assigned ambulance room
      if (emergency.assignedAmbulance) {
        await realtimeGateway.toRoom(`ambulance:${emergency.assignedAmbulance}`, event, payload);
      }

      // Globally notify the system-wide admin monitoring dashboard
      await realtimeGateway.toRoom('admin_monitoring', event, payload);
      
    } catch (error) {
      logger.error(`[EMERGENCY_GATEWAY] Broadcast failed for ${event}: ${error.message}`);
    }
  }

  /**
   * Handler: Triggered when an SOS is newly created in the database.
   */
  async _handleEmergencyCreated(payload) {
    logger.debug('[EMERGENCY_GATEWAY] Broadcasting EMERGENCY_CREATED');
    
    // An emergency was just created, there is no hospital or ambulance yet.
    // Notify the patient that the system received it, and notify admins.
    await this._broadcastToParticipants(REALTIME_EVENTS.EMERGENCY_CREATED, payload);
  }

  /**
   * Handler: Triggered on any state transition (Triage, Hospital, Ambulance, Pickup, Dropoff)
   */
  async _handleEmergencyUpdated(payload) {
    logger.debug('[EMERGENCY_GATEWAY] Broadcasting EMERGENCY_UPDATED');
    
    // Sync the newest state payload to all active participants in the emergency
    await this._broadcastToParticipants(REALTIME_EVENTS.EMERGENCY_UPDATED, payload);
  }

  /**
   * Handler: Triggered when an emergency is fully resolved and closed.
   */
  async _handleEmergencyCompleted(payload) {
    logger.debug('[EMERGENCY_GATEWAY] Broadcasting EMERGENCY_COMPLETED');
    await this._broadcastToParticipants(REALTIME_EVENTS.EMERGENCY_COMPLETED, payload);
  }

  /**
   * Handler: Triggered when an emergency is manually aborted by the patient or admin.
   */
  async _handleEmergencyCancelled(payload) {
    logger.debug('[EMERGENCY_GATEWAY] Broadcasting EMERGENCY_CANCELLED');
    await this._broadcastToParticipants(REALTIME_EVENTS.EMERGENCY_CANCELLED, payload);
  }
}

// Instantiate to immediately bind subscriptions to the singleton EventBus on server boot
export const emergencyGateway = new EmergencyGateway();
