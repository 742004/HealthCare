import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { doctorService } from '../../src/services/doctor.service.js';
import { doctorRepository } from '../../src/repositories/doctor.repository.js';
import { userRepository } from '../../src/repositories/user.repository.js';
import { sessionRepository } from '../../src/repositories/session.repository.js';
import { emergencyRepository } from '../../src/repositories/emergency.repository.js';
import { auditService } from '../../src/services/audit.service.js';
import { ApiError } from '../../src/utils/ApiError.js';
import Doctor from '../../src/models/Doctor.js';

// Remove jest.mock calls

describe('DoctorService', () => {
  let mockSession;
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockDoctorId = new mongoose.Types.ObjectId().toString();
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn()
    };
    mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

    jest.spyOn(doctorRepository, 'findProfileByUser').mockImplementation(() => {});
    jest.spyOn(doctorRepository, 'createProfile').mockImplementation(() => {});
    jest.spyOn(doctorRepository, 'updateProfileByUserId').mockImplementation(() => {});
    jest.spyOn(doctorRepository, 'softDeleteByUserId').mockImplementation(() => {});
    jest.spyOn(userRepository, 'updateById').mockImplementation(() => {});
    jest.spyOn(sessionRepository, 'revokeAllUserSessions').mockImplementation(() => {});
    jest.spyOn(Doctor, 'findOne').mockImplementation(() => {});
    jest.spyOn(auditService, 'logEvent').mockImplementation(() => {});
  });

  describe('createProfile', () => {
    const validData = {
      specialization: 'Cardiology',
      licenseNumber: 'MD12345',
      experienceYears: 10
    };

    it('DOCTOR-001: Should create a valid profile', async () => {
      doctorRepository.findProfileByUser.mockResolvedValue(null);
      Doctor.findOne.mockResolvedValue(null);
      doctorRepository.createProfile.mockResolvedValue({ _id: mockDoctorId, ...validData });

      const result = await doctorService.createProfile(mockUserId, validData);
      
      expect(result._id).toBe(mockDoctorId);
      expect(doctorRepository.createProfile).toHaveBeenCalledWith({ ...validData, user: mockUserId }, mockSession);
      expect(auditService.logEvent).toHaveBeenCalledWith('DOCTOR_PROFILE_CREATED', mockUserId, { doctorId: mockDoctorId });
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });

    it('DOCTOR-002: Should reject duplicate profile creation for same user', async () => {
      doctorRepository.findProfileByUser.mockResolvedValue({ _id: mockDoctorId });

      await expect(doctorService.createProfile(mockUserId, validData))
        .rejects.toThrow(ApiError);
      
      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it('DOCTOR-003: Should reject profile creation if license exists', async () => {
      doctorRepository.findProfileByUser.mockResolvedValue(null);
      Doctor.findOne.mockResolvedValue({ _id: 'another_doctor' });

      await expect(doctorService.createProfile(mockUserId, validData))
        .rejects.toThrow('Doctor with this license number already exists');
      
      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('DOCTOR-006: Should ignore immutable fields (hospital, licenseNumber, isVerified) during update', async () => {
      doctorRepository.findProfileByUser.mockResolvedValue({ _id: mockDoctorId, user: mockUserId });
      doctorRepository.updateProfileByUserId.mockResolvedValue({ _id: mockDoctorId });

      const maliciousUpdate = {
        specialization: 'Neurology',
        hospital: new mongoose.Types.ObjectId().toString(),
        licenseNumber: 'HACKED123',
        isVerified: true
      };

      await doctorService.updateProfile(mockUserId, maliciousUpdate);

      expect(doctorRepository.updateProfileByUserId).toHaveBeenCalledWith(
        mockUserId,
        { specialization: 'Neurology' } // Only specialization should pass
      );
    });
  });

  describe('updateAvailability', () => {
    it('DOCTOR-014: Should update availability if verified', async () => {
      doctorRepository.findProfileByUser.mockResolvedValue({ _id: mockDoctorId, isVerified: true });
      doctorRepository.updateProfileByUserId.mockResolvedValue({ _id: mockDoctorId, availabilityStatus: 'Busy' });

      await doctorService.updateAvailability(mockUserId, 'Busy');
      
      expect(doctorRepository.updateProfileByUserId).toHaveBeenCalledWith(mockUserId, { availabilityStatus: 'Busy' });
      expect(auditService.logEvent).toHaveBeenCalledWith('DOCTOR_AVAILABILITY_CHANGED', mockUserId, { status: 'Busy' });
    });

    it('DOCTOR-015: Should reject availability update if not verified', async () => {
      doctorRepository.findProfileByUser.mockResolvedValue({ _id: mockDoctorId, isVerified: false });

      await expect(doctorService.updateAvailability(mockUserId, 'Available'))
        .rejects.toThrow('Unverified doctors cannot change availability status');
    });
  });

  describe('deleteProfile', () => {
    it('DOCTOR-029: Should soft delete profile, user, and revoke sessions', async () => {
      doctorRepository.softDeleteByUserId.mockResolvedValue({ _id: mockDoctorId });
      userRepository.updateById.mockResolvedValue(true);
      sessionRepository.revokeAllUserSessions.mockResolvedValue(true);

      await doctorService.deleteProfile(mockUserId);

      expect(doctorRepository.softDeleteByUserId).toHaveBeenCalledWith(mockUserId, mockSession);
      expect(userRepository.updateById).toHaveBeenCalledWith(mockUserId, { isActive: false }, mockSession);
      expect(sessionRepository.revokeAllUserSessions).toHaveBeenCalledWith(mockUserId);
      expect(auditService.logEvent).toHaveBeenCalledWith('DOCTOR_PROFILE_DEACTIVATED', mockUserId, { doctorId: mockDoctorId });
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });
  });
});
