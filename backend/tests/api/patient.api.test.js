import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import { tokenService } from '../../src/utils/token.service.js';
import Patient from '../../src/models/Patient.js';
import User from '../../src/models/User.js';
import Doctor from '../../src/models/Doctor.js';
import Ambulance from '../../src/models/Ambulance.js';
import Hospital from '../../src/models/Hospital.js';
import EmergencyRequest from '../../src/models/EmergencyRequest.js';

describe('Patient API Integration Tests', () => {
  let patientToken, doctorToken, driverToken, hospitalToken;
  let patientUser, doctorUser, driverUser, hospitalUser;
  let targetPatient;
  
  beforeEach(async () => {
    process.env.JWT_SECRET = 'default_access_secret';
    await User.deleteMany({});
    await Patient.deleteMany({});
    await Doctor.deleteMany({});
    await Hospital.deleteMany({});
    await Ambulance.deleteMany({});
    await EmergencyRequest.deleteMany({});

    const baseUser = { name: 'Test User', password: 'password1234' };
    patientUser = await User.create({ ...baseUser, phone: '1000000001', email: 'p@test.com', role: 'patient' });
    doctorUser = await User.create({ ...baseUser, phone: '1000000002', email: 'd@test.com', role: 'doctor' });
    driverUser = await User.create({ ...baseUser, phone: '1000000003', email: 'a@test.com', role: 'driver' });
    hospitalUser = await User.create({ ...baseUser, phone: '1000000004', email: 'h@test.com', role: 'hospital' });

    patientToken = (await tokenService.createTokenPair(patientUser)).accessToken;
    doctorToken = (await tokenService.createTokenPair(doctorUser)).accessToken;
    driverToken = (await tokenService.createTokenPair(driverUser)).accessToken;
    hospitalToken = (await tokenService.createTokenPair(hospitalUser)).accessToken;

    targetPatient = await Patient.create({
      user: patientUser._id,
      dateOfBirth: '1990-01-01',
      bloodGroup: 'O+',
      gender: 'Male',
      emergencyContacts: [{ name: 'Test', phone: '1234567890', relation: 'Friend' }],
      location: { type: 'Point', coordinates: [10, 20] },
      isActive: true
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/v1/patients/:id', () => {
    it('PATIENT-011: Unauthenticated request -> 401', async () => {
      const res = await request(app).get(`/api/v1/patients/${targetPatient._id}`);
      if(res.status !== 401) console.log(res.body);
      expect(res.status).toBe(401);
    });

    it('Unauthorized role -> 403 (e.g. patient trying to get another patient by ID via this route)', async () => {
      // The route specifically expects doctor, admin, hospital, driver
      const res = await request(app).get(`/api/v1/patients/${targetPatient._id}`)
        .set('Authorization', `Bearer ${patientToken}`);
      if(res.status !== 403) console.log(res.body);
      expect(res.status).toBe(403);
    });

    it('PATIENT-006: Doctor unauthorized patient (Unrelated) -> 403', async () => {
      await Doctor.create({ user: doctorUser._id, hospital: new mongoose.Types.ObjectId(), specialization: 'General', licenseNumber: 'doc1', experienceYears: 5 });
      const res = await request(app).get(`/api/v1/patients/${targetPatient._id}`)
        .set('Authorization', `Bearer ${doctorToken}`);
      expect(res.status).toBe(403);
    });

    it('PATIENT-025: Doctor unauthorized patient (Same-hospital but unassigned) -> 403', async () => {
      const hospital = await Hospital.create({ admin: hospitalUser._id, name: 'H1', registrationNumber: 'reg1', contactNumber: '123', location: { coordinates: [0, 0] } });
      const doctor = await Doctor.create({ user: doctorUser._id, hospital: hospital._id, specialization: 'General', licenseNumber: 'doc1_b', experienceYears: 5 });
      
      // Emergency is assigned to the HOSPITAL, but NOT this specific doctor
      await EmergencyRequest.create({ 
        patient: targetPatient._id, hospital: hospital._id, pickupLocation: { coordinates: [0,0] }
      });

      const res = await request(app).get(`/api/v1/patients/${targetPatient._id}`)
        .set('Authorization', `Bearer ${doctorToken}`);
      expect(res.status).toBe(403); // Security fix ensures this is DENIED
    });

    it('PATIENT-005: Doctor authorized patient -> 200', async () => {
      const hospital = await Hospital.create({ admin: hospitalUser._id, name: 'H1', registrationNumber: 'reg1', contactNumber: '123', location: { coordinates: [0, 0] } });
      const doctor = await Doctor.create({ user: doctorUser._id, hospital: hospital._id, specialization: 'General', licenseNumber: 'doc2', experienceYears: 5 });
      await EmergencyRequest.create({ 
        patient: targetPatient._id, doctor: doctor._id, hospital: hospital._id, pickupLocation: { coordinates: [0,0] }
      });

      const res = await request(app).get(`/api/v1/patients/${targetPatient._id}`)
        .set('Authorization', `Bearer ${doctorToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.dateOfBirth).toBeDefined();
    });

    it('PATIENT-008: Hospital unauthorized emergency -> 403 (For a different patient)', async () => {
      const otherPatient = await Patient.create({
        user: new mongoose.Types.ObjectId(), dateOfBirth: '1990-01-01', bloodGroup: 'A+', gender: 'Male', emergencyContacts: [{ name: 'Test', phone: '1234567890', relation: 'Friend' }]
      });
      const res = await request(app).get(`/api/v1/patients/${otherPatient._id}`)
        .set('Authorization', `Bearer ${hospitalToken}`);
      expect(res.status).toBe(403);
    });

    it('PATIENT-007: Hospital authorized emergency -> 200', async () => {
      const hospital = await Hospital.create({ admin: hospitalUser._id, name: 'H2', registrationNumber: 'reg2', contactNumber: '1234', location: { coordinates: [0, 0] } });
      await EmergencyRequest.create({ patient: targetPatient._id, hospital: hospital._id, pickupLocation: { coordinates: [0,0] } });
      const res = await request(app).get(`/api/v1/patients/${targetPatient._id}`)
        .set('Authorization', `Bearer ${hospitalToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.bloodGroup).toBe('O+');
    });

    it('PATIENT-010: Ambulance unrelated emergency -> 403', async () => {
      const res = await request(app).get(`/api/v1/patients/${targetPatient._id}`)
        .set('Authorization', `Bearer ${driverToken}`);
      expect(res.status).toBe(403); // No ambulance assigned yet
    });

    it('PATIENT-009: Ambulance assigned emergency -> 200', async () => {
      const amb = await Ambulance.create({ driver: driverUser._id, vehicleNumber: 'AMB1', vehicleType: 'Basic Life Support (BLS)' });
      await EmergencyRequest.create({ patient: targetPatient._id, ambulance: amb._id, pickupLocation: { coordinates: [0,0] } });

      const res = await request(app).get(`/api/v1/patients/${targetPatient._id}`)
        .set('Authorization', `Bearer ${driverToken}`);
      expect(res.status).toBe(200);
      // Data minimization check
      expect(res.body.data.address).toBeUndefined();
      expect(res.body.data.emergencyContacts).toBeUndefined();
      expect(res.body.data.bloodGroup).toBeDefined();
    });
  });

  describe('GET /api/v1/patients/me', () => {
    it('PATIENT-003: Own profile -> success', async () => {
      const res = await request(app).get(`/api/v1/patients/me`)
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.gender).toBe('Male');
    });
  });

  describe('Validation & Edges', () => {
    it('PATIENT-012: Validation failures', async () => {
      const res = await request(app).patch(`/api/v1/patients/me`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ bloodGroup: 'INVALID' });
      expect(res.status).toBe(400); // Or 422 depending on Zod middleware mapping
    });

    it('PATIENT-024: Soft-deleted patient behavior', async () => {
      const delRes = await request(app).delete(`/api/v1/patients/me`).set('Authorization', `Bearer ${patientToken}`);
      expect(delRes.status).toBe(200);
      const res = await request(app).get(`/api/v1/patients/me`).set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(401); // User is soft-deleted, so findById returns null in middleware -> 401
    });
  });
});
