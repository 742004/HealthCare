import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * TransactionManager
 * Centralized infrastructure component for managing MongoDB transactions.
 * Abstracts the boilerplate of sessions, commits, aborts, and retries away from the business services.
 */
class TransactionManager {
  /**
   * ============================================================================
   * RETRY & NESTING PLACEHOLDERS
   * ============================================================================
   */
  async _withRetry(transactionCallback, maxRetries = 3) {
    // Retry logic placeholder for TransientTransactionError
    // Requires tracking attempt count and applying exponential backoff
    return await transactionCallback();
  }

  async _handleNestedTransaction(session, callback) {
    // Placeholder for nested transaction logic (savepoints)
    // MongoDB does not natively support nested transactions, so this would 
    // require application-level tracking or merging into the parent session.
    logger.debug('[TRANSACTION] Executing within existing nested session.');
    return await callback(session);
  }

  /**
   * Executes a business logic callback within an ACID-compliant MongoDB transaction.
   * Handles automatic commit on success and automatic rollback on failure.
   * 
   * @param {Function} callback - Async function that receives the (session) as its argument.
   * @param {mongoose.ClientSession} [existingSession=null] - Optional session for nested calls.
   * @returns {Promise<any>} The result of the callback.
   * @throws {Error} Re-throws the error after aborting the transaction.
   */
  async execute(callback, existingSession = null) {
    if (typeof callback !== 'function') {
      throw new Error('TransactionManager requires a valid callback function.');
    }

    if (existingSession) {
      return this._handleNestedTransaction(existingSession, callback);
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    const transactionId = session.id?.id ? session.id.id.toString('hex').substring(0, 8) : 'unknown';

    logger.debug(`[TRANSACTION] Started TX-${transactionId}`);

    try {
      // Execute the provided business logic
      const result = await callback(session);

      // Commit and cleanup
      await session.commitTransaction();
      logger.debug(`[TRANSACTION] Committed TX-${transactionId}`);
      
      return result;
    } catch (error) {
      // Rollback and cleanup
      await session.abortTransaction();
      
      // Do not log 4xx ApiErrors as severe transaction crashes; they are expected business rule failures
      if (error instanceof ApiError && error.statusCode < 500) {
        logger.debug(`[TRANSACTION] Aborted TX-${transactionId} due to ApiError: ${error.message}`);
      } else {
        logger.error(`[TRANSACTION] Aborted TX-${transactionId} due to unexpected crash: ${error.stack}`);
      }

      throw error; // Re-throw to be caught by the Controller/AsyncHandler
    } finally {
      // Always end the session to prevent connection pooling memory leaks
      session.endSession();
    }
  }
}

export const transactionManager = new TransactionManager();
