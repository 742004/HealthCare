import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Optional: system notifications might not have a sender
    },
    emergencyRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmergencyRequest' // Optional context link
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['Alert', 'Info', 'Success', 'Warning'],
      default: 'Info'
    },
    isRead: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ receiver: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
