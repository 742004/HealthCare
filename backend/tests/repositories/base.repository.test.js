import mongoose from 'mongoose';

import { BaseRepository } from '../../src/repositories/base.repository.js';
import { ApiError } from '../../src/utils/ApiError.js';


// A simple schema for testing
const testSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, default: 'PENDING' }
}, { timestamps: true });

const TestModel = mongoose.model('TestModel', testSchema);

class TestRepository extends BaseRepository {
  constructor() {
    super(TestModel);
  }
}

const repo = new TestRepository();



afterEach(async () => {
  await TestModel.deleteMany({});
});

describe('BaseRepository', () => {
  describe('CRUD Operations', () => {
    it('should create a document', async () => {
      const doc = await repo.create({ name: 'Test 1' });
      expect(doc._id).toBeDefined();
      expect(doc.name).toBe('Test 1');
      expect(doc.status).toBe('PENDING');
    });

    it('should find a document by ID', async () => {
      const created = await repo.create({ name: 'Test 2' });
      const found = await repo.findById(created._id);
      expect(found).not.toBeNull();
      expect(found.name).toBe('Test 2');
    });

    it('should throw 400 for invalid ID format', async () => {
      await expect(repo.findById('invalid-id')).rejects.toThrow(ApiError);
      await expect(repo.findById('invalid-id')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should update a document', async () => {
      const created = await repo.create({ name: 'Test 3' });
      const updated = await repo.updateById(created._id, { status: 'COMPLETED' });
      expect(updated.status).toBe('COMPLETED');
    });

    it('should throw 404 for updating non-existent document', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(repo.updateById(fakeId, { name: 'New' })).rejects.toThrow(ApiError);
      await expect(repo.updateById(fakeId, { name: 'New' })).rejects.toMatchObject({ statusCode: 404 });
    });

    it('should delete a document', async () => {
      const created = await repo.create({ name: 'Test 4' });
      await repo.deleteById(created._id);
      
      const found = await repo.findById(created._id);
      expect(found).toBeNull();
    });
  });

  describe('Concurrency Control', () => {
    it('should successfully update with matching version', async () => {
      const created = await repo.create({ name: 'Concurrency Test' });
      const currentVersion = created.__v;

      const updated = await repo.updateWithConcurrency(created._id, { status: 'ACTIVE' }, currentVersion);
      
      expect(updated.status).toBe('ACTIVE');
      expect(updated.__v).toBe(currentVersion + 1); // Version should increment
    });

    it('should throw 409 conflict if version does not match', async () => {
      const created = await repo.create({ name: 'Concurrency Conflict Test' });
      
      const staleVersion = created.__v; // The version before the update
      
      // Simulate another transaction updating the record first
      await repo.updateWithConcurrency(created._id, { status: 'MODIFIED' }, staleVersion);
      
      // Attempting to update with stale version should fail
      await expect(
        repo.updateWithConcurrency(created._id, { status: 'SHOULD_FAIL' }, staleVersion)
      ).rejects.toThrow(ApiError);
      
      await expect(
        repo.updateWithConcurrency(created._id, { status: 'SHOULD_FAIL' }, staleVersion)
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });
});
