import mongoose from 'mongoose';

const notificationHistorySchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    dataPayload: { type: mongoose.Schema.Types.Mixed, default: {} },
    type: {
      type: String,
      enum: [
        'EMERGENCY_CREATED', 'HOSPITAL_ASSIGNED', 'AMBULANCE_DISPATCHED', 
        'AMBULANCE_ARRIVED', 'DOCTOR_ASSIGNED', 'MEDICAL_RECORD_UPDATED', 
        'CHAT_MESSAGE_RECEIVED', 'SYSTEM_BROADCAST'
      ],
      required: true,
    },
    deliveryStatus: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED'],
      default: 'PENDING',
    },
    retryCount: { type: Number, default: 0 },
    error: { type: String },
    sentAt: { type: Date },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
);

notificationHistorySchema.index({ recipientId: 1, createdAt: -1 });

export default mongoose.models.NotificationHistory || mongoose.model('NotificationHistory', notificationHistorySchema);
