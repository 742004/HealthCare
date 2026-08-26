import { BaseRepository } from './base.repository.js';
import Session from '../models/Session.js';

export class SessionRepository extends BaseRepository {
  constructor() {
    super(Session);
  }

  async findByJti(jti, session = null) {
    return this.findOne({ jti }, session);
  }

  async revokeSession(jti, session = null) {
    return this.model.findOneAndUpdate(
      { jti, revokedAt: null },
      { revokedAt: new Date() },
      { new: true, session }
    );
  }

  async revokeAllUserSessions(userId, session = null) {
    return this.model.updateMany(
      { user: userId, revokedAt: null },
      { revokedAt: new Date() },
      { session }
    );
  }

  async getActiveSessions(userId, session = null) {
    return this.find({ 
      user: userId, 
      revokedAt: null,
      expiresAt: { $gt: new Date() }
    }, { sort: { createdAt: -1 } }, session);
  }
}

export const sessionRepository = new SessionRepository();
