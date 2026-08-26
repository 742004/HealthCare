import mongoose from 'mongoose';

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    emergencyAlerts: { type: Boolean, default: true },
    hospitalUpdates: { type: Boolean, default: true },
    ambulanceUpdates: { type: Boolean, default: true },
    chatNotifications: { type: Boolean, default: true },
    medicalRecordUpdates: { type: Boolean, default: true },
    appointmentReminders: { type: Boolean, default: true },
    marketing: { type: Boolean, default: false },
    doNotDisturb: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: '22:00' }, // HH:mm
      endTime: { type: String, default: '07:00' },   // HH:mm
    },
  },
  { timestamps: true }
);

export default mongoose.models.NotificationPreference || mongoose.model('NotificationPreference', notificationPreferenceSchema);
