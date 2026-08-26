/**
 * Abstract Notification Provider
 * 
 * Defines the contract that any Notification provider (Firebase, APNs, OneSignal) must implement.
 * Ensures the application is decoupled from the specific push vendor.
 */
export class NotificationProvider {
  async initialize() {
    throw new Error('Method "initialize()" must be implemented.');
  }

  async healthCheck() {
    throw new Error('Method "healthCheck()" must be implemented.');
  }

  async sendToDevice(token, payload, options) {
    throw new Error('Method "sendToDevice()" must be implemented.');
  }

  async sendToMultipleDevices(tokens, payload, options) {
    throw new Error('Method "sendToMultipleDevices()" must be implemented.');
  }

  async sendToTopic(topic, payload, options) {
    throw new Error('Method "sendToTopic()" must be implemented.');
  }

  async subscribeToTopic(tokens, topic) {
    throw new Error('Method "subscribeToTopic()" must be implemented.');
  }

  async unsubscribeFromTopic(tokens, topic) {
    throw new Error('Method "unsubscribeFromTopic()" must be implemented.');
  }

  async validateToken(token) {
    throw new Error('Method "validateToken()" must be implemented.');
  }
}
