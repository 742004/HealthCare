import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import { EMERGENCY_STATUS, AMBULANCE_STATUS } from '../utils/constants.js';
import { generateUniqueReference } from '../utils/helpers.js';

import { hospitalService } from './hospital.service.js';
import { ambulanceService } from './ambulance.service.js';

/**
 * ============================================================================
 * REPOSITORY PLACEHOLDERS
 * ============================================================================
 */
const EmergencyRepository = {
  findEmergencyById: async (id, session = null) => null,
  findByIdempotencyKey: async (key, session = null) => null,
  createEmergency: async (data, session = null) => null,
  updateEmergency: async (id, data, session = null) => null,
};

const PatientRepository = {
  findProfileByUser: async (userId, session = null) => null,
};

/**
 * ============================================================================
 * EXTERNAL SERVICE PLACEHOLDERS
 * ============================================================================
 */
const mapsService = { findNearbyHospitals: async (lat, lng, radius) => [] };
const aiService = { analyzeTriage: async (symptoms, vitals) => ({ severity: 'HIGH' }) };
const notificationService = { sendPushNotification: async () => true, broadcastToRole: async () => true };
const firebaseService = { publishRealtimeUpdate: async () => true };

/**
 * ============================================================================
 * STATE MACHINE & TRANSITION RULES
 * ============================================================================
 */
const ALLOWED_TRANSITIONS = {
  [EMERGENCY_STATUS.PENDING]: [EMERGENCY_STATUS.ACCEPTED, EMERGENCY_STATUS.CANCELLED],
  [EMERGENCY_STATUS.ACCEPTED]: [EMERGENCY_STATUS.AMBULANCE_ASSIGNED, EMERGENCY_STATUS.CANCELLED],
  [EMERGENCY_STATUS.AMBULANCE_ASSIGNED]: [EMERGENCY_STATUS.DRIVER_EN_ROUTE, EMERGENCY_STATUS.CANCELLED],
  [EMERGENCY_STATUS.DRIVER_EN_ROUTE]: [EMERGENCY_STATUS.PATIENT_PICKED, EMERGENCY_STATUS.CANCELLED],
  [EMERGENCY_STATUS.PATIENT_PICKED]: [EMERGENCY_STATUS.HOSPITAL_NOTIFIED, EMERGENCY_STATUS.ARRIVED_AT_HOSPITAL],
  [EMERGENCY_STATUS.HOSPITAL_NOTIFIED]: [EMERGENCY_STATUS.ARRIVED_AT_HOSPITAL],
  [EMERGENCY_STATUS.ARRIVED_AT_HOSPITAL]: [EMERGENCY_STATUS.COMPLETED],
  [EMERGENCY_STATUS.COMPLETED]: [],
  [EMERGENCY_STATUS.CANCELLED]: [],
};

class EmergencyService {
  /**
   * Internal helper to verify ownership/existence
   * @private
   */
  async _verifyEmergencyExists(emergencyId, session = null) {
    const emergency = await EmergencyRepository.findEmergencyById(emergencyId, session);
    if (!emergency) throw new ApiError(404, 'Emergency request not found', 'EMERGENCY_NOT_FOUND');
    return emergency;
  }

  /**
   * Evaluates if a state transition is valid based on the finite state machine.
   * @private
   */
  _enforceStateTransition(currentStatus, newStatus) {
    const allowedNextStates = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowedNextStates.includes(newStatus)) {
      throw new ApiError(400, `Invalid state transition from ${currentStatus} to ${newStatus}`, 'INVALID_STATE_TRANSITION');
    }
  }

  /**
   * ============================================================================
   * EVENT & QUEUE HOOK PLACEHOLDERS (BullMQ, RabbitMQ, SQS)
   * ============================================================================
   */
  async _onEmergencyCreated(emergency) { /* Trigger initial queue jobs (AI, dispatching) */ }
  async _onHospitalAssigned(emergency) { /* Trigger hospital prep events */ }
  async _onAmbulanceAssigned(emergency) { /* Trigger routing and GPS socket events */ }
  async _onPatientPicked(emergency) { /* Trigger hospital ETA notification */ }
  async _onEmergencyCompleted(emergency) { /* Trigger billing, archival, and cleanup queues */ }

  /**
   * ============================================================================
   * METRICS HOOK PLACEHOLDERS
   * ============================================================================
   */
  _recordResponseTimeMetrics(emergencyId) {}
  _recordDispatchTimeMetrics(emergencyId) {}
  _recordHospitalArrivalTimeMetrics(emergencyId) {}
  _recordTreatmentTimeMetrics(emergencyId) {}
  _recordCompletionTimeMetrics(emergencyId) {}

  /**
   * 1. Creates an Emergency (SOS) Request with Idempotency.
   * @param {string} patientUserId - The User ID initiating the SOS.
   * @param {Object} emergencyData - Location, symptoms.
   * @param {string} idempotencyKey - Unique key from client to prevent duplicates.
   */
  async createEmergency(patientUserId, emergencyData, idempotencyKey = null) {
    if (idempotencyKey) {
      const existingReq = await EmergencyRepository.findByIdempotencyKey(idempotencyKey);
      if (existingReq) return existingReq; // Return cached response to prevent duplicates
    }

    if (!emergencyData.location || !emergencyData.location.coordinates) {
      throw new ApiError(400, 'Valid GPS location is required');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const patient = await PatientRepository.findProfileByUser(patientUserId, session);
      if (!patient) throw new ApiError(404, 'Patient profile required');

      const payload = {
        ...emergencyData,
        patient: patient._id,
        referenceNumber: generateUniqueReference('SOS'),
        status: EMERGENCY_STATUS.PENDING,
        idempotencyKey
      };

      const emergency = await EmergencyRepository.createEmergency(payload, session);
      logger.info(`[AUDIT] Emergency Created: ${emergency._id}`);

      await session.commitTransaction();
      session.endSession();
      
      firebaseService.publishRealtimeUpdate(`emergencies/new`, { emergencyId: emergency._id });
      this._onEmergencyCreated(emergency);
      
      return emergency;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * 2. AI Triage Analysis.
   */
  async performAITriage(emergencyId, symptoms, vitalSigns) {
    await this._verifyEmergencyExists(emergencyId);
    const triageResult = await aiService.analyzeTriage(symptoms, vitalSigns);
    
    const updated = await EmergencyRepository.updateEmergency(emergencyId, {
      aiAnalysis: triageResult,
      severity: triageResult.severity
    });

    logger.info(`[AUDIT] AI Triage Completed: ${emergencyId}`);
    return updated;
  }

  /**
   * 3. Hospital Discovery.
   */
  async discoverHospitals(emergencyId) {
    const emergency = await this._verifyEmergencyExists(emergencyId);
    const [lng, lat] = emergency.location.coordinates;
    return await mapsService.findNearbyHospitals(lat, lng, 15);
  }

  /**
   * 4. Ambulance Dispatch.
   */
  async dispatchAmbulance(emergencyId, ambulanceId) {
    const emergency = await this._verifyEmergencyExists(emergencyId);
    this._enforceStateTransition(emergency.status, EMERGENCY_STATUS.AMBULANCE_ASSIGNED);

    await ambulanceService.acceptDispatch(ambulanceId, emergencyId);
    notificationService.broadcastToRole('DRIVER', 'New Dispatch', 'Emergency dispatch.', { emergencyId });
    
    this._recordDispatchTimeMetrics(emergencyId);
    this._onAmbulanceAssigned(emergencyId);
    logger.info(`[AUDIT] Ambulance Dispatched: ${ambulanceId}`);
    return true;
  }

  /**
   * 5. Hospital Assignment.
   */
  async assignHospital(emergencyId, hospitalId) {
    const emergency = await this._verifyEmergencyExists(emergencyId);
    this._enforceStateTransition(emergency.status, EMERGENCY_STATUS.ACCEPTED);

    await hospitalService.acceptEmergency(hospitalId, emergencyId);
    notificationService.sendPushNotification(hospitalId, 'Incoming SOS', 'Patient en route', { emergencyId });
    
    this._onHospitalAssigned(emergencyId);
    logger.info(`[AUDIT] Hospital Assigned: ${hospitalId}`);
    return true;
  }

  /**
   * Advances the timeline ensuring strict state machine transitions.
   */
  async advanceTimeline(emergencyId, newStatus) {
    const emergency = await this._verifyEmergencyExists(emergencyId);
    
    this._enforceStateTransition(emergency.status, newStatus);
    
    const updated = await EmergencyRepository.updateEmergency(emergencyId, { status: newStatus });
    firebaseService.publishRealtimeUpdate(`emergencies/${emergencyId}`, { status: newStatus });
    
    if (newStatus === EMERGENCY_STATUS.PATIENT_PICKED) {
      this._onPatientPicked(updated);
      this._recordResponseTimeMetrics(emergencyId);
    } else if (newStatus === EMERGENCY_STATUS.ARRIVED_AT_HOSPITAL) {
      this._recordHospitalArrivalTimeMetrics(emergencyId);
    }

    logger.info(`[AUDIT] Timeline Advanced to ${newStatus}: ${emergencyId}`);
    return updated;
  }

  /**
   * Cancels emergency safely.
   */
  async cancelEmergency(emergencyId, patientUserId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const emergency = await this._verifyEmergencyExists(emergencyId, session);
      this._enforceStateTransition(emergency.status, EMERGENCY_STATUS.CANCELLED);

      await EmergencyRepository.updateEmergency(emergencyId, { status: EMERGENCY_STATUS.CANCELLED }, session);

      notificationService.sendPushNotification(emergency.patient, 'Cancelled', 'SOS cancelled.');
      logger.warn(`[AUDIT] Emergency Cancelled: ${emergencyId}`);

      await session.commitTransaction();
      session.endSession();
      return true;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Completes the emergency lifecycle.
   */
  async completeEmergency(emergencyId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const emergency = await this._verifyEmergencyExists(emergencyId, session);
      this._enforceStateTransition(emergency.status, EMERGENCY_STATUS.COMPLETED);
      
      await EmergencyRepository.updateEmergency(emergencyId, { status: EMERGENCY_STATUS.COMPLETED }, session);
      
      if (emergency.assignedAmbulance) {
        await ambulanceService.completeTrip(emergency.assignedAmbulance, emergencyId);
      }

      this._recordCompletionTimeMetrics(emergencyId);
      this._onEmergencyCompleted(emergencyId);

      logger.info(`[AUDIT] Emergency Completed: ${emergencyId}`);
      await session.commitTransaction();
      session.endSession();
      return true;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}

export const emergencyService = new EmergencyService();
