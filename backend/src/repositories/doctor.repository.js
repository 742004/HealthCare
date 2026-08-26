import { BaseRepository } from './base.repository.js';
import Doctor from '../models/Doctor.js';

export class DoctorRepository extends BaseRepository {
  constructor() {
    super(Doctor);
  }

  async createProfile(data, session = null) {
    return this.create(data, session);
  }

  async findProfileByUser(userId, session = null) {
    return this.findOne({ user: userId, isActive: true }, session);
  }

  async findProfileById(id, session = null) {
    return this.findOne({ _id: id, isActive: true }, session);
  }

  async updateProfileByUserId(userId, updateData, session = null) {
    return this.model.findOneAndUpdate({ user: userId, isActive: true }, updateData, { new: true, session });
  }

  async softDeleteByUserId(userId, session = null) {
    return this.model.findOneAndUpdate({ user: userId, isActive: true }, { isActive: false }, { new: true }).session(session);
  }
}

export const doctorRepository = new DoctorRepository();
