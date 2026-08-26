import { BaseRepository } from './base.repository.js';
import Patient from '../models/Patient.js';

export class PatientRepository extends BaseRepository {
  constructor() {
    super(Patient);
  }

  async createProfile(data, session = null) {
    return this.create(data, session);
  }

  async findProfileByUser(userId, session = null) {
    return this.findOne({ user: userId, isActive: true }, session);
  }
  
  async findProfileByUserIncludingInactive(userId, session = null) {
    return this.findOne({ user: userId }, session);
  }

  async findProfileById(id, session = null) {
    return this.findOne({ _id: id, isActive: true }, session);
  }

  async updateProfileByUserId(userId, updateData, session = null) {
    return this.findOneAndUpdate({ user: userId, isActive: true }, updateData, { new: true }, session);
  }

  async updateLocation(userId, newLocation, newTimestamp) {
    // Stale location protection: Only update if the new timestamp is strictly greater than the existing one,
    // or if the existing one is not set.
      return this.model.findOneAndUpdate(
        { 
          user: userId, 
          isActive: true,
          $or: [
            { locationUpdatedAt: { $exists: false } },
            { locationUpdatedAt: { $lt: newTimestamp } }
          ]
        },
        { 
          $set: { 
            location: newLocation, 
            locationUpdatedAt: newTimestamp 
          } 
        },
        { new: true }
      );
  }

  async softDeleteByUserId(userId, session = null) {
    return this.model.findOneAndUpdate({ user: userId, isActive: true }, { isActive: false }, { new: true }).session(session);
  }
}

export const patientRepository = new PatientRepository();
