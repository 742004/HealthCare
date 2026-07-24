import logger from '../utils/logger.js';

/**
 * ============================================================================
 * CACHE NAMESPACES (GROUPS)
 * Used to prefix keys, allowing for targeted pattern invalidation.
 * ============================================================================
 */
export const CACHE_GROUPS = {
  AUTH: 'auth',
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  HOSPITAL: 'hospital',
  AMBULANCE: 'ambulance',
  EMERGENCY: 'emergency',
  MEDICAL_RECORD: 'medical_record',
  CHAT: 'chat',
  NOTIFICATION: 'notification',
  MAPS: 'maps',
  AI: 'ai'
};

/**
 * ============================================================================
 * PROVIDER ADAPTERS
 * Abstracts caching logic away from Redis / Node-Cache / Memcached
 * ============================================================================
 */
class BaseCacheProvider {
  async get(key) { throw new Error('Not implemented'); }
  async set(key, value, ttlSeconds) { throw new Error('Not implemented'); }
  async delete(key) { throw new Error('Not implemented'); }
  async exists(key) { throw new Error('Not implemented'); }
  async clear() { throw new Error('Not implemented'); }
  async invalidatePattern(pattern) { throw new Error('Not implemented'); }
  async increment(key, amount) { throw new Error('Not implemented'); }
  async decrement(key, amount) { throw new Error('Not implemented'); }
}

/**
 * Basic in-memory cache utilizing a native JS Map.
 * Suitable for local development and single-instance monoliths.
 */
class MemoryCacheProvider extends BaseCacheProvider {
  constructor() {
    super();
    this.store = new Map();
  }

  async get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key, value, ttlSeconds = 3600) {
    const expiresAt = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null;
    this.store.set(key, { value, expiresAt });
    return true;
  }

  async delete(key) {
    return this.store.delete(key);
  }

  async exists(key) {
    return (await this.get(key)) !== null;
  }

  async clear() {
    this.store.clear();
    return true;
  }

  async invalidatePattern(pattern) {
    const regex = new RegExp(pattern.replace('*', '.*'));
    let count = 0;
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  async increment(key, amount = 1) {
    let val = (await this.get(key)) || 0;
    val += amount;
    await this.set(key, val);
    return val;
  }

  async decrement(key, amount = 1) {
    let val = (await this.get(key)) || 0;
    val -= amount;
    await this.set(key, val);
    return val;
  }
}

// Prepare adapters for distributed environments
class RedisCacheProvider extends BaseCacheProvider {}
class MockCacheProvider extends BaseCacheProvider {}

// The active provider (can be dynamically injected later based on app.config.js)
const activeProvider = new MemoryCacheProvider();

/**
 * Cache Manager
 * Centralized interface for all application caching needs.
 */
class CacheManager {
  constructor() {
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Helper to format namespace keys.
   * @private
   */
  _formatKey(group, key) {
    return `${group}:${key}`;
  }

  async get(group, key) {
    try {
      const formattedKey = this._formatKey(group, key);
      const value = await activeProvider.get(formattedKey);
      
      if (value !== null) {
        this.hits++;
        logger.debug(`[CACHE] Hit: ${formattedKey}`);
      } else {
        this.misses++;
        logger.debug(`[CACHE] Miss: ${formattedKey}`);
      }
      return value;
    } catch (error) {
      logger.error(`[CACHE] Get failed for ${key}: ${error.message}`);
      return null; // Fallback gracefully if Redis crashes
    }
  }

  async set(group, key, value, ttlSeconds = 3600) {
    try {
      const formattedKey = this._formatKey(group, key);
      await activeProvider.set(formattedKey, value, ttlSeconds);
      return true;
    } catch (error) {
      logger.error(`[CACHE] Set failed for ${key}: ${error.message}`);
      return false;
    }
  }

  async delete(group, key) {
    const formattedKey = this._formatKey(group, key);
    return await activeProvider.delete(formattedKey);
  }

  async exists(group, key) {
    const formattedKey = this._formatKey(group, key);
    return await activeProvider.exists(formattedKey);
  }

  async clear() {
    logger.warn('[AUDIT] Cache completely cleared.');
    return await activeProvider.clear();
  }

  async increment(group, key) {
    return await activeProvider.increment(this._formatKey(group, key));
  }

  async decrement(group, key) {
    return await activeProvider.decrement(this._formatKey(group, key));
  }

  /**
   * Advanced: Attempts to fetch a value. If missing, executes the callback, 
   * caches the result, and returns it.
   */
  async remember(group, key, ttlSeconds, callback) {
    let value = await this.get(group, key);
    if (value !== null) return value;

    logger.debug(`[CACHE] Remember callback executed for: ${this._formatKey(group, key)}`);
    value = await callback();
    await this.set(group, key, value, ttlSeconds);
    return value;
  }

  /**
   * Advanced: Invalidates all keys matching a specific pattern (e.g., "hospital:*")
   */
  async invalidatePattern(pattern) {
    const count = await activeProvider.invalidatePattern(pattern);
    logger.info(`[AUDIT] Cache pattern ${pattern} invalidated ${count} entries.`);
    return count;
  }

  /**
   * ============================================================================
   * PERFORMANCE PLACEHOLDERS
   * ============================================================================
   */
  async _warmCache(keys) { /* Pre-fetch high-access keys on server start */ }
  async _applyEvictionPolicy() { /* LRU / LFU eviction logic */ }
  async _compressPayload(data) { /* Gzip/Brotli compression for large payloads */ }

  /**
   * ============================================================================
   * MONITORING
   * ============================================================================
   */
  getHitRate() {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : (this.hits / total) * 100;
  }

  getMissRate() {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : (this.misses / total) * 100;
  }

  getStatistics() {
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: `${this.getHitRate().toFixed(2)}%`,
      missRate: `${this.getMissRate().toFixed(2)}%`
    };
  }
}

export const cacheManager = new CacheManager();
