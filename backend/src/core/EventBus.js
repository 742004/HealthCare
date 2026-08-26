import { EventEmitter } from 'events';
import logger from '../utils/logger.js';

/**
 * ============================================================================
 * DOMAIN EVENTS REGISTRY
 * Standardized events representing state changes in the business domain.
 * ============================================================================
 */
export const DOMAIN_EVENTS = {
  // Authentication
  USER_REGISTERED: 'USER_REGISTERED',
  USER_VERIFIED: 'USER_VERIFIED',
  USER_LOGGED_IN: 'USER_LOGGED_IN',

  // Emergency
  EMERGENCY_CREATED: 'EMERGENCY_CREATED',
  AI_TRIAGE_COMPLETED: 'AI_TRIAGE_COMPLETED',
  HOSPITAL_ASSIGNED: 'HOSPITAL_ASSIGNED',
  AMBULANCE_ASSIGNED: 'AMBULANCE_ASSIGNED',
  PATIENT_PICKED: 'PATIENT_PICKED',
  ARRIVED_AT_HOSPITAL: 'ARRIVED_AT_HOSPITAL',
  EMERGENCY_COMPLETED: 'EMERGENCY_COMPLETED',

  // Hospital
  BED_AVAILABILITY_UPDATED: 'BED_AVAILABILITY_UPDATED',
  DOCTOR_ASSIGNED: 'DOCTOR_ASSIGNED',

  // Ambulance
  DRIVER_ASSIGNED: 'DRIVER_ASSIGNED',
  LOCATION_UPDATED: 'LOCATION_UPDATED',

  // Medical
  MEDICAL_RECORD_CREATED: 'MEDICAL_RECORD_CREATED',
  PRESCRIPTION_ADDED: 'PRESCRIPTION_ADDED',

  // Notification & Chat
  NOTIFICATION_SENT: 'NOTIFICATION_SENT',
  MESSAGE_SENT: 'MESSAGE_SENT'
};

/**
 * ============================================================================
 * PROVIDER ADAPTERS (Event Broker Abstractions)
 * ============================================================================
 */
class BaseEventProvider {
  publish(event, payload) { throw new Error('Not implemented'); }
  subscribe(event, handler) { throw new Error('Not implemented'); }
  unsubscribe(event, handler) { throw new Error('Not implemented'); }
}

/**
 * Default Local Implementation utilizing Node.js native EventEmitter.
 * Suitable for monolithic architectures.
 */
class LocalEventProvider extends BaseEventProvider {
  constructor() {
    super();
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(50); // Increased for high-traffic core domains
  }

  publish(event, payload) {
    this.emitter.emit(event, payload);
  }

  subscribe(event, handler) {
    this.emitter.on(event, handler);
  }

  unsubscribe(event, handler) {
    this.emitter.off(event, handler);
  }
}

// Prepare adapters for Microservices / Distributed architectures
class RedisPubSubProvider extends BaseEventProvider {}
class RabbitMQProvider extends BaseEventProvider {}
class KafkaProvider extends BaseEventProvider {}
class BullMQProvider extends BaseEventProvider {}

// The active provider (can be injected later based on app.config.js)
const activeProvider = new LocalEventProvider();

/**
 * Domain Event Bus
 * 
 * Centralized pub/sub mechanism to decouple micro-domain services.
 * Allows services to react to domain changes asynchronously without strict dependencies.
 */
class EventBus {
  constructor() {
    this.middlewares = [];
  }

  /**
   * Registers a middleware function that intercepts events before they are published.
   * Useful for auditing, metrics, or schema validation.
   * 
   * @param {Function} middleware - Function(event, payload)
   */
  registerMiddleware(middleware) {
    if (typeof middleware !== 'function') throw new Error('Middleware must be a function');
    this.middlewares.push(middleware);
  }

  /**
   * Synchronously publishes a domain event to all local subscribers.
   * 
   * @param {string} eventName - Standardized event from DOMAIN_EVENTS.
   * @param {Object} payload - Data related to the event.
   */
  publish(eventName, payload) {
    // Run through middlewares (e.g., Audit Logging)
    for (const middleware of this.middlewares) {
      try {
        middleware(eventName, payload);
      } catch (error) {
        logger.error(`[EVENT_BUS] Middleware execution failed for ${eventName}: ${error.message}`);
      }
    }

    logger.debug(`[EVENT_BUS] Published: ${eventName}`);
    activeProvider.publish(eventName, payload);
  }

  /**
   * Asynchronously publishes a domain event, yielding the event loop immediately.
   * Essential for non-blocking HTTP request processing.
   * 
   * @param {string} eventName - Standardized event from DOMAIN_EVENTS.
   * @param {Object} payload - Data related to the event.
   */
  async publishAsync(eventName, payload) {
    setImmediate(() => {
      this.publish(eventName, payload);
    });
  }

  /**
   * Subscribes a handler to a specific domain event.
   * 
   * @param {string} eventName - Standardized event from DOMAIN_EVENTS.
   * @param {Function} handler - Callback function executing the business logic.
   */
  subscribe(eventName, handler) {
    logger.debug(`[EVENT_BUS] Subscriber attached to: ${eventName}`);
    activeProvider.subscribe(eventName, handler);
  }

  /**
   * Unsubscribes a previously attached handler.
   * 
   * @param {string} eventName - Standardized event from DOMAIN_EVENTS.
   * @param {Function} handler - The exact function reference originally passed.
   */
  unsubscribe(eventName, handler) {
    logger.debug(`[EVENT_BUS] Subscriber removed from: ${eventName}`);
    activeProvider.unsubscribe(eventName, handler);
  }
}

export const eventBus = new EventBus();

// ============================================================================
// GLOBAL EVENT MIDDLEWARE
// Automatically audits every domain event flowing through the bus.
// ============================================================================
eventBus.registerMiddleware((event, payload) => {
  // Avoid overwhelming logs with noisy events like location updates
  if (event !== DOMAIN_EVENTS.LOCATION_UPDATED) {
    logger.info(`[DOMAIN_EVENT_AUDIT] ${event} triggered.`);
  }
});
