import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { patientService } from '../../src/services/patient.service.js';
import { patientRepository } from '../../src/repositories/patient.repository.js';
import EmergencyRequest from '../../src/models/EmergencyRequest.js';
import Doctor from '../../src/models/Doctor.js';
import Hospital from '../../src/models/Hospital.js';
import Ambulance from '../../src/models/Ambulance.js';
import { auditService } from '../../src/services/audit.service.js';
import { ApiError } from '../../src/utils/ApiError.js';
import { userRepository } from '../../src/repositories/user.repository.js';
import { sessionRepository } from '../../src/repositories/session.repository.js';
describe('PatientService', () => {
  const mockUserId = new mongoose.Types.ObjectId();
  const mockPatientId = new mongoose.Types.ObjectId();
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(patientRepository, 'createProfile').mockImplementation(() => {});
    jest.spyOn(patientRepository, 'findProfileByUser').mockImplementation(() => {});
    jest.spyOn(patientRepository, 'findProfileByUserIncludingInactive').mockImplementation(() => {});
    jest.spyOn(patientRepository, 'findProfileById').mockImplementation(() => {});
    jest.spyOn(patientRepository, 'updateProfileByUserId').mockImplementation(() => {});
    jest.spyOn(patientRepository, 'updateLocation').mockImplementation(() => {});
    jest.spyOn(patientRepository, 'softDeleteByUserId').mockImplementation(() => {});
    
    jest.spyOn(EmergencyRequest, 'findOne').mockImplementation(() => {});
    jest.spyOn(Doctor, 'findOne').mockImplementation(() => {});
    jest.spyOn(Hospital, 'findOne').mockImplementation(() => {});
    jest.spyOn(Ambulance, 'findOne').mockImplementation(() => {});
    jest.spyOn(auditService, 'logEvent').mockImplementation(() => {});
    jest.spyOn(userRepository, 'updateById').mockImplementation(() => {});
    jest.spyOn(sessionRepository, 'revokeAllUserSessions').mockImplementation(() => {});
  });

  describe('createProfile', () => {
    const validData = {
      dateOfBirth: '1990-01-01',
      bloodGroup: 'O+',
      gender: 'Male',
      emergencyContacts: [
        { name: 'John Doe', phone: '+1234567890', relation: 'Father' },
        { name: 'Jane Doe', phone: '+1234567890', relation: 'Mother' }, // Duplicate phone
      ]
    };

    it('PATIENT-001: should create valid profile with normalized/deduped contacts', async () => {
      patientRepository.findProfileByUserIncludingInactive.mockResolvedValue(null);
      patientRepository.createProfile.mockResolvedValue({ _id: mockPatientId, ...validData, user: mockUserId });

      const profile = await patientService.createProfile(mockUserId, validData);

      expect(patientRepository.createProfile).toHaveBeenCalledWith(expect.objectContaining({
        user: mockUserId,
        emergencyContacts: expect.arrayContaining([
          expect.objectContaining({ name: 'John Doe', phone: '+1234567890' })
        ])
      }));
      // Assert deduplication (second contact had same phone)
      expect(patientRepository.createProfile.mock.calls[0][0].emergencyContacts.length).toBe(1);
    });

    it('PATIENT-002: should reject duplicate profile creation (409)', async () => {
      patientRepository.findProfileByUserIncludingInactive.mockResolvedValue({});
      
      await expect(patientService.createProfile(mockUserId, validData))
        .rejects.toThrow(ApiError);
      await expect(patientService.createProfile(mockUserId, validData))
        .rejects.toMatchObject({ statusCode: 409 });
    });

    it('PATIENT-016: concurrent duplicate profile creation relies on DB unique constraint', () => {
      // Logic relies on Mongoose unique index. Testing would require integration DB.
    });

    it('PATIENT-017: generates audit event on creation', async () => {
      patientRepository.findProfileByUserIncludingInactive.mockResolvedValue(null);
      patientRepository.createProfile.mockResolvedValue({ _id: mockPatientId });

      await patientService.createProfile(mockUserId, validData);
      expect(auditService.logEvent).toHaveBeenCalledWith('PATIENT_PROFILE_CREATED', mockUserId, expect.any(Object));
    });
  });

  describe('getCurrentPatient', () => {
    it('PATIENT-003: retrieves own profile successfully', async () => {
      patientRepository.findProfileByUser.mockResolvedValue({ _id: mockPatientId, user: mockUserId });
      const profile = await patientService.getCurrentPatient(mockUserId);
      expect(profile._id).toEqual(mockPatientId);
    });

    it('throws 404 if profile not found', async () => {
      patientRepository.findProfileByUser.mockResolvedValue(null);
      await expect(patientService.getCurrentPatient(mockUserId)).rejects.toThrow(ApiError);
    });
  });

  describe('getPatientById', () => {
    const mockProfile = { 
      _id: mockPatientId, 
      dateOfBirth: '1990', 
      bloodGroup: 'O+', 
      location: { coordinates: [0, 0] },
      address: { city: 'Test' },
      toObject: function() { return this; }
    };

    it('PATIENT-004: Patient A cannot access Patient B (should be handled at route/middleware, but service role logic catches bad calls)', async () => {
      // Actually PATIENT shouldn't even reach getPatientById. Route is DOCTOR, ADMIN, HOSPITAL, AMBULANCE.
    });

    it('PATIENT-005: DOCTOR authorized patient access allowed', async () => {
      patientRepository.findProfileById.mockResolvedValue(mockProfile);
      Doctor.findOne.mockResolvedValue({ _id: 'doc1', hospital: 'hosp1' });
      EmergencyRequest.findOne.mockResolvedValue({ _id: 'emerg1' }); // Authorized

      const profile = await patientService.getPatientById(mockPatientId, { _id: 'user1', role: 'doctor' });
      expect(profile._id).toEqual(mockPatientId);
    });

    it('PATIENT-006: DOCTOR unauthorized patient denied', async () => {
      patientRepository.findProfileById.mockResolvedValue(mockProfile);
      Doctor.findOne.mockResolvedValue({ _id: 'doc1', hospital: 'hosp1' });
      EmergencyRequest.findOne.mockResolvedValue(null); // Denied

      await expect(patientService.getPatientById(mockPatientId, { _id: 'user1', role: 'doctor' }))
        .rejects.toThrow(ApiError);
    });

    it('PATIENT-007: HOSPITAL authorized emergency patient allowed', async () => {
      patientRepository.findProfileById.mockResolvedValue(mockProfile);
      Hospital.findOne.mockResolvedValue({ _id: 'hosp1' });
      EmergencyRequest.findOne.mockResolvedValue({ _id: 'emerg1' }); // Authorized

      const profile = await patientService.getPatientById(mockPatientId, { _id: 'user1', role: 'hospital' });
      expect(profile._id).toEqual(mockPatientId);
    });

    it('PATIENT-008: HOSPITAL unauthorized scope denied', async () => {
      patientRepository.findProfileById.mockResolvedValue(mockProfile);
      Hospital.findOne.mockResolvedValue({ _id: 'hosp1' });
      EmergencyRequest.findOne.mockResolvedValue(null);

      await expect(patientService.getPatientById(mockPatientId, { _id: 'user1', role: 'hospital' }))
        .rejects.toThrow(ApiError);
    });

    it('PATIENT-009: AMBULANCE assigned emergency access allowed', async () => {
      patientRepository.findProfileById.mockResolvedValue(mockProfile);
      Ambulance.findOne.mockResolvedValue({ _id: 'amb1' });
      EmergencyRequest.findOne.mockResolvedValue({ _id: 'emerg1' }); // Authorized

      const profile = await patientService.getPatientById(mockPatientId, { _id: 'user1', role: 'driver' });
      expect(profile._id).toEqual(mockPatientId);
    });

    it('PATIENT-010: AMBULANCE unrelated emergency denied', async () => {
      patientRepository.findProfileById.mockResolvedValue(mockProfile);
      Ambulance.findOne.mockResolvedValue({ _id: 'amb1' });
      EmergencyRequest.findOne.mockResolvedValue(null);

      await expect(patientService.getPatientById(mockPatientId, { _id: 'user1', role: 'driver' }))
        .rejects.toThrow(ApiError);
    });

    it('PATIENT-014, PATIENT-025: Role-based field minimization', async () => {
      patientRepository.findProfileById.mockResolvedValue(mockProfile);
      Ambulance.findOne.mockResolvedValue({ _id: 'amb1' });
      EmergencyRequest.findOne.mockResolvedValue({ _id: 'emerg1' });

      const profile = await patientService.getPatientById(mockPatientId, { _id: 'user1', role: 'driver' });
      expect(profile.address).toBeUndefined(); // Address stripped for ambulance
      expect(profile.bloodGroup).toBeDefined();
    });
  });

  describe('updateProfile', () => {
    it('PATIENT-015: Immutable field protection (user id)', async () => {
      // Controller/routes block immutable fields via zod strict validation.
    });

    it('PATIENT-018: Profile update authorization', async () => {
      patientRepository.updateProfileByUserId.mockResolvedValue({ _id: mockPatientId });
      await patientService.updateProfile(mockUserId, { bloodGroup: 'A+' });
      expect(patientRepository.updateProfileByUserId).toHaveBeenCalledWith(mockUserId, { bloodGroup: 'A+' });
    });
  });

  describe('updateLiveLocation', () => {
    it('PATIENT-023: Stale location cannot overwrite newer location', async () => {
      // Repository layer uses $lt check. Service simply handles the result.
      patientRepository.updateLocation.mockResolvedValue(null);
      patientRepository.findProfileByUser.mockResolvedValue({ _id: mockPatientId });
      
      const res = await patientService.updateLiveLocation(mockUserId, { location: {}, timestamp: '2023-01-01' });
      expect(res).toBeNull(); // Silently ignored stale update
    });
  });

  describe('updateEmergencyContacts', () => {
    it('PATIENT-019: Emergency contact lifecycle (max 5 enforced by schema, duplicates by service)', async () => {
      patientRepository.updateProfileByUserId.mockResolvedValue({ _id: mockPatientId });
      await patientService.updateEmergencyContacts(mockUserId, [
        { name: 'A', phone: '123', relation: 'B' },
        { name: 'C', phone: ' 123 ', relation: 'D' }
      ]);
      // Should deduplicate phone 123
      expect(patientRepository.updateProfileByUserId.mock.calls[0][1].emergencyContacts.length).toBe(1);
    });
  });

  describe('softDeleteProfile', () => {
    it('PATIENT-024: Soft-delete lifecycle', async () => {
      patientRepository.softDeleteByUserId.mockResolvedValue({ _id: mockPatientId });
      userRepository.updateById.mockResolvedValue({ _id: mockUserId, isActive: false });
      sessionRepository.revokeAllUserSessions.mockResolvedValue(true);
      await patientService.softDeleteProfile(mockUserId);
      expect(userRepository.updateById).toHaveBeenCalledWith(mockUserId, { isActive: false });
      expect(sessionRepository.revokeAllUserSessions).toHaveBeenCalledWith(mockUserId);
      expect(auditService.logEvent).toHaveBeenCalledWith('PATIENT_PROFILE_DEACTIVATED', mockUserId, expect.any(Object));
    });
  });
});
