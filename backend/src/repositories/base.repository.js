import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

/**
 * Base Repository providing standard CRUD operations.
 * Designed to enforce session passing for transactions and standard error handling.
 */
export class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  /**
   * Helper to append session to query options
   */
  _getOptions(session, additionalOptions = {}) {
    return session ? { session, ...additionalOptions } : additionalOptions;
  }

  async create(data, session = null) {
    try {
      const docs = await this.model.create([data], this._getOptions(session));
      return docs[0];
    } catch (error) {
      if (error.code === 11000) {
        throw new ApiError(409, `Duplicate entry found for ${this.model.modelName}`);
      }
      throw error;
    }
  }

  async findById(id, session = null) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, `Invalid ID format for ${this.model.modelName}`);
    }
    return this.model.findById(id, null, this._getOptions(session));
  }

  async findOne(query, session = null) {
    return this.model.findOne(query, null, this._getOptions(session));
  }

  async find(query = {}, options = {}, session = null) {
    const { sort, limit, skip, populate } = options;
    let queryBuilder = this.model.find(query, null, this._getOptions(session));
    
    if (sort) queryBuilder = queryBuilder.sort(sort);
    if (skip) queryBuilder = queryBuilder.skip(skip);
    if (limit) queryBuilder = queryBuilder.limit(limit);
    if (populate) queryBuilder = queryBuilder.populate(populate);

    return queryBuilder.exec();
  }

  async updateById(id, updateData, session = null) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, `Invalid ID format for ${this.model.modelName}`);
    }
    
    const options = this._getOptions(session, { new: true, runValidators: true });
    const updated = await this.model.findByIdAndUpdate(id, updateData, options);
    
    if (!updated) {
      throw new ApiError(404, `${this.model.modelName} not found for update`);
    }
    return updated;
  }

  async deleteById(id, session = null) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, `Invalid ID format for ${this.model.modelName}`);
    }

    const deleted = await this.model.findByIdAndDelete(id, this._getOptions(session));
    if (!deleted) {
      throw new ApiError(404, `${this.model.modelName} not found for deletion`);
    }
    return true;
  }

  /**
   * For optimistic concurrency control (__v)
   */
  async updateWithConcurrency(id, updateData, expectedVersion, session = null) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, `Invalid ID format for ${this.model.modelName}`);
    }

    const options = this._getOptions(session, { new: true, runValidators: true });
    const query = { _id: id, __v: expectedVersion };
    
    // Automatically increment the version on successful update
    const updatePayload = {
      ...updateData,
      $inc: { __v: 1 }
    };

    const updated = await this.model.findOneAndUpdate(query, updatePayload, options);
    
    if (!updated) {
      throw new ApiError(409, `Concurrency conflict: ${this.model.modelName} was modified by another transaction`);
    }
    return updated;
  }
}
