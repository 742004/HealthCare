import { BaseRepository } from './base.repository.js';
import User from '../models/User.js';

export class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email, session = null) {
    return this.findOne({ email: email.toLowerCase() }, session);
  }

  async findByEmailWithPassword(email, session = null) {
    return this.model.findOne({ email: email.toLowerCase() })
      .select('+password +isActive')
      .session(session);
  }

  async findByPhone(phone, session = null) {
    return this.findOne({ phone }, session);
  }

  async incrementTokenVersion(userId, session = null) {
    return this.model.findByIdAndUpdate(
      userId,
      { $inc: { tokenVersion: 1 } },
      { new: true, session }
    );
  }

  async lockAccount(userId, session = null) {
    return this.updateById(userId, { isLocked: true }, session);
  }

  async unlockAccount(userId, session = null) {
    return this.updateById(userId, { isLocked: false }, session);
  }
}

export const userRepository = new UserRepository();
