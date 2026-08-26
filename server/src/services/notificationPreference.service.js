import NotificationPreference from '../models/NotificationPreference.js';
import { ApiError } from '../utils/ApiError.js';

class NotificationPreferenceService {
  async getPreferences(userId) {
    try {
      let prefs = await NotificationPreference.findOne({ userId });
      if (!prefs) {
        prefs = await NotificationPreference.create({ userId });
      }
      return prefs;
    } catch (error) {
      throw new ApiError(500, 'Failed to fetch notification preferences');
    }
  }

  async updatePreferences(userId, updateData) {
    try {
      const prefs = await NotificationPreference.findOneAndUpdate(
        { userId },
        { $set: updateData },
        { new: true, upsert: true }
      );
      return prefs;
    } catch (error) {
      throw new ApiError(500, 'Failed to update notification preferences');
    }
  }

  async canSendNotification(userId, type) {
    const prefs = await this.getPreferences(userId);
    
    // Check DND
    if (prefs.doNotDisturb?.enabled) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      
      const [startHour, startMin] = prefs.doNotDisturb.startTime.split(':').map(Number);
      const [endHour, endMin] = prefs.doNotDisturb.endTime.split(':').map(Number);
      
      const currentTotal = currentHour * 60 + currentMin;
      const startTotal = startHour * 60 + startMin;
      const endTotal = endHour * 60 + endMin;

      // Handle overnight DND
      if (startTotal > endTotal) {
        if (currentTotal >= startTotal || currentTotal <= endTotal) return false;
      } else {
        if (currentTotal >= startTotal && currentTotal <= endTotal) return false;
      }
    }

    // Check specific preferences based on type
    switch (type) {
      case 'EMERGENCY_CREATED':
      case 'EMERGENCY_ALERTS':
        return prefs.emergencyAlerts;
      case 'HOSPITAL_ASSIGNED':
        return prefs.hospitalUpdates;
      case 'AMBULANCE_DISPATCHED':
      case 'AMBULANCE_ARRIVED':
        return prefs.ambulanceUpdates;
      case 'CHAT_MESSAGE_RECEIVED':
        return prefs.chatNotifications;
      case 'MEDICAL_RECORD_UPDATED':
        return prefs.medicalRecordUpdates;
      case 'SYSTEM_BROADCAST':
        return prefs.marketing;
      default:
        return true;
    }
  }
}

export default new NotificationPreferenceService();
