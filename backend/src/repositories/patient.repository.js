import { BaseRepository } from './base.repository.js';
import Patient from '../models/Patient.js';

export class PatientRepository extends BaseRepository {
  constructor() {
    super(Patient);
  }

  async findProfileByUser(userId, session = null) {
    return this.findOne({ user: userId }, session);
  }
}

export const patientRepository = new PatientRepository();
