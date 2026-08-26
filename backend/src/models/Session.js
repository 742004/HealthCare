import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  jti: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  hashedToken: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index, automatically removes expired sessions
  },
  revokedAt: {
    type: Date
  },
  replacedBy: {
    type: String // JTI of the token that replaced this one
  },
  metadata: {
    ip: String,
    userAgent: String,
    deviceInfo: String,
    fcmToken: String
  }
}, { timestamps: true });

// Index for efficient querying by user and valid status
sessionSchema.index({ user: 1, revokedAt: 1, expiresAt: 1 });

const Session = mongoose.model('Session', sessionSchema);
export default Session;
