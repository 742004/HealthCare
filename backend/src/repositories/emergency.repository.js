import { BaseRepository } from './base.repository.js';
import EmergencyRequest from '../models/EmergencyRequest.js';

export class EmergencyRepository extends BaseRepository {
  constructor() {
    super(EmergencyRequest);
  }

  async findByIdempotencyKey(key, session = null) {
    return this.findOne({ idempotencyKey: key }, session);
  }

  async findActiveEmergenciesByPatient(patientId, session = null) {
    return this.find(
      { 
        patient: patientId, 
        status: { $nin: ['COMPLETED', 'CANCELLED'] } 
      }, 
      { sort: { createdAt: -1 } }, 
      session
    );
  }

  async assignAmbulance(emergencyId, ambulanceId, expectedStatus, session = null) {
    return this.model.findOneAndUpdate(
      { _id: emergencyId, status: expectedStatus },
      { 
        assignedAmbulance: ambulanceId, 
        status: 'AMBULANCE_ASSIGNED',
        $inc: { __v: 1 } // Optimistic concurrency
      },
      { new: true, session }
    );
  }

  async assignHospital(emergencyId, hospitalId, expectedStatus, session = null) {
    return this.model.findOneAndUpdate(
      { _id: emergencyId, status: expectedStatus },
      { 
        assignedHospital: hospitalId, 
        status: 'ACCEPTED',
        $inc: { __v: 1 }
      },
      { new: true, session }
    );
  }
}

export const emergencyRepository = new EmergencyRepository();
