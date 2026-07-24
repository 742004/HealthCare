import DeviceToken from '../models/DeviceToken.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import { FirebaseProvider } from '../providers/firebase.provider.js';

class DeviceTokenService {
  constructor() {
    this.provider = new FirebaseProvider();
  }

  async registerToken(userId, token, deviceType) {
    try {
      let deviceToken = await DeviceToken.findOne({ userId, token });
      if (deviceToken) {
        deviceToken.isActive = true;
        deviceToken.lastUsedAt = Date.now();
        await deviceToken.save();
      } else {
        deviceToken = await DeviceToken.create({ userId, token, deviceType });
      }
      return deviceToken;
    } catch (error) {
      logger?.error(`DeviceToken registerToken error: ${error.message}`);
      throw new ApiError(500, 'Failed to register device token');
    }
  }

  async removeToken(userId, token) {
    try {
      await DeviceToken.findOneAndDelete({ userId, token });
      return true;
    } catch (error) {
      throw new ApiError(500, 'Failed to remove device token');
    }
  }

  async deactivateInvalidTokens(tokens) {
    if (!tokens || tokens.length === 0) return;
    try {
      await DeviceToken.updateMany(
        { token: { $in: tokens } },
        { $set: { isActive: false } }
      );
    } catch (error) {
      logger?.error(`Failed to deactivate invalid tokens: ${error.message}`);
    }
  }

  async getUserTokens(userId) {
    try {
      const tokens = await DeviceToken.find({ userId, isActive: true }).select('token -_id');
      return tokens.map(t => t.token);
    } catch (error) {
      throw new ApiError(500, 'Failed to fetch user device tokens');
    }
  }
}

export default new DeviceTokenService();
