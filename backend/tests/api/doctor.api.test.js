import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import Doctor from '../../src/models/Doctor.js';
import { generateAccessToken } from '../../src/utils/jwt.js';

describe('Doctor API', () => {
  let user;
  let token;

  beforeAll(async () => {
    // Connect to in-memory DB or test DB configured via jest setup
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI_TEST);
    }
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Doctor.deleteMany({});
    
    user = await User.create({
      name: 'Dr. John Doe',
      email: 'johndoe@hospital.com',
      password: 'password12345',
      phone: '+1234567891',
      role: 'doctor', // Note lowercase as per SEC-001 fix
      isActive: true,
      tokenVersion: 0
    });

    token = generateAccessToken(user);
  });

  describe('POST /api/v1/doctors', () => {
    it('DOCTOR-001: Should create a doctor profile', async () => {
      const res = await request(app)
        .post('/api/v1/doctors')
        .set('Authorization', `Bearer ${token}`)
        .send({
          hospital: new mongoose.Types.ObjectId().toString(),
          specialization: 'Neurology',
          licenseNumber: 'NEURO-1001',
          experienceYears: 5
        });

      if (res.status !== 201) console.log(res.body);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.specialization).toBe('Neurology');
    });

    it('DOCTOR-031: Should create a doctor profile without a hospital', async () => {
      const res = await request(app)
        .post('/api/v1/doctors')
        .set('Authorization', `Bearer ${token}`)
        .send({
          specialization: 'Neurology',
          licenseNumber: 'NEURO-1002',
          experienceYears: 5
        });

      if (res.status !== 201) console.log(res.body);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hospital).toBeUndefined(); // Hospital should not be set
    });

    it('DOCTOR-023: Should reject missing licenseNumber (Zod validation)', async () => {
      const res = await request(app)
        .post('/api/v1/doctors')
        .set('Authorization', `Bearer ${token}`)
        .send({
          hospital: new mongoose.Types.ObjectId().toString(),
          specialization: 'Neurology',
          experienceYears: 5
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('body.licenseNumber: Required');
    });

    it('DOCTOR-024: Should handle concurrent duplicate profile creation for same user deterministically', async () => {
      const payload = {
        specialization: 'Neurology',
        licenseNumber: 'NEURO-1003',
        experienceYears: 5
      };

      // Launch 3 requests concurrently
      const requests = [
        request(app).post('/api/v1/doctors').set('Authorization', `Bearer ${token}`).send(payload),
        request(app).post('/api/v1/doctors').set('Authorization', `Bearer ${token}`).send(payload),
        request(app).post('/api/v1/doctors').set('Authorization', `Bearer ${token}`).send(payload)
      ];

      const responses = await Promise.all(requests);
      
      const successResponses = responses.filter(r => r.status === 201);
      const conflictResponses = responses.filter(r => r.status === 400 || r.status === 409 || r.status === 500);

      if (successResponses.length !== 1 || conflictResponses.length !== 2) {
        console.log('DOCTOR-024 statuses:', responses.map(r => r.status));
        console.log('DOCTOR-024 bodies:', responses.map(r => r.body));
      }

      expect(successResponses.length).toBe(1);
      expect(conflictResponses.length).toBe(2);

      const docs = await Doctor.find({ user: user._id });
      expect(docs.length).toBe(1); // Database contains exactly one profile
    });

    it('DOCTOR-025: Should handle concurrent duplicate license creation deterministically', async () => {
      const user2 = await User.create({
        name: 'Dr. Jane Doe',
        email: 'janedoe@hospital.com',
        password: 'password12345',
        phone: '+1234567895',
        role: 'doctor',
        isActive: true,
        tokenVersion: 0
      });
      const token2 = generateAccessToken(user2);

      const payload = {
        specialization: 'Neurology',
        licenseNumber: 'SHARED-LICENSE',
        experienceYears: 5
      };

      // Launch 2 requests concurrently for different users with same license
      const requests = [
        request(app).post('/api/v1/doctors').set('Authorization', `Bearer ${token}`).send(payload),
        request(app).post('/api/v1/doctors').set('Authorization', `Bearer ${token2}`).send(payload)
      ];

      const responses = await Promise.all(requests);
      
      const successResponses = responses.filter(r => r.status === 201);
      const conflictResponses = responses.filter(r => r.status === 400 || r.status === 409 || r.status === 500);

      if (successResponses.length !== 1 || conflictResponses.length !== 1) {
        console.log('DOCTOR-025 statuses:', responses.map(r => r.status));
        console.log('DOCTOR-025 bodies:', responses.map(r => r.body));
      }

      expect(successResponses.length).toBe(1);
      expect(conflictResponses.length).toBe(1);

      const docs = await Doctor.find({ licenseNumber: 'SHARED-LICENSE' });
      expect(docs.length).toBe(1);
    });
  });

  describe('PATCH /api/v1/doctors/me', () => {
    it('DOCTOR-007, DOCTOR-006: Should ignore immutable fields (hospital, isVerified) during update', async () => {
      const doc = await Doctor.create({
        user: user._id,
        specialization: 'Cardiology',
        licenseNumber: 'IMMUTABLE-1',
        experienceYears: 10,
        isVerified: false
      });

      const maliciousHospitalId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .patch('/api/v1/doctors/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          hospital: maliciousHospitalId,
          isVerified: true,
          specialization: 'Neurology'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.specialization).toBe('Neurology');
      expect(res.body.data.hospital).toBeUndefined(); // Should still be unassigned
      expect(res.body.data.isVerified).toBe(false); // Should remain false
    });
  });

  describe('GET /api/v1/doctors/:id (Public Projection)', () => {
    it('DOCTOR-022: Should return minimized projection and hide sensitive info', async () => {
      const doctor = await Doctor.create({
        user: user._id,
        hospital: new mongoose.Types.ObjectId().toString(),
        specialization: 'Cardiology',
        licenseNumber: 'SECURE-999',
        experienceYears: 12,
        isVerified: false,
        isActive: true
      });

      const res = await request(app)
        .get(`/api/v1/doctors/${doctor._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.specialization).toBe('Cardiology');
      expect(res.body.data.licenseNumber).toBeUndefined(); // Sensitive
      expect(res.body.data.isVerified).toBeUndefined(); // Sensitive
      expect(res.body.data.isActive).toBeUndefined(); // Sensitive
    });
  });

  describe('PATCH /api/v1/doctors/me/availability', () => {
    it('DOCTOR-014: Should update availability if verified', async () => {
      await Doctor.create({
        user: user._id,
        hospital: new mongoose.Types.ObjectId().toString(),
        specialization: 'Cardiology',
        licenseNumber: 'SECURE-999',
        experienceYears: 12,
        isVerified: true
      });

      const res = await request(app)
        .patch('/api/v1/doctors/me/availability')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'Busy' });

      if (res.status !== 200) console.log(res.body);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.availabilityStatus).toBe('Busy');
    });

    it('DOCTOR-016: Should reject invalid status enum', async () => {
      await Doctor.create({
        user: user._id,
        hospital: new mongoose.Types.ObjectId().toString(),
        specialization: 'Cardiology',
        experienceYears: 10,
        licenseNumber: 'SECURE-999',
        isVerified: true
      });

      const res = await request(app)
        .patch('/api/v1/doctors/me/availability')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'OFFLINE' });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
    });
    it('DOCTOR-015: Should reject availability update if not verified', async () => {
      await Doctor.create({
        user: user._id,
        specialization: 'Cardiology',
        experienceYears: 10,
        licenseNumber: 'SECURE-1000',
        isVerified: false
      });

      const res = await request(app)
        .patch('/api/v1/doctors/me/availability')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'Busy' });

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('fail');
    });
  });
});
