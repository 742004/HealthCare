import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import { patientRepository } from '../repositories/patient.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { sessionRepository } from '../repositories/session.repository.js';
import EmergencyRequest from '../models/EmergencyRequest.js';
import Doctor from '../models/Doctor.js';
import Ambulance from '../models/Ambulance.js';
import Hospital from '../models/Hospital.js';
import { auditService } from './audit.service.js';

class PatientService {
  /**
   * Creates a new Patient profile linked to a User account.
   */
  async createProfile(userId, patientData) {
    const existingProfile = await patientRepository.findProfileByUserIncludingInactive(userId);
    if (existingProfile) {
      throw new ApiError(409, 'Patient profile already exists for this user', 'PROFILE_EXISTS');
    }

    // Phone normalization and duplicate check within array
    const normalizedContacts = this._normalizeContacts(patientData.emergencyContacts);

    const newProfileData = { 
      ...patientData, 
      user: userId,
      emergencyContacts: normalizedContacts
    };
    
    // No explicit transaction needed here since it's a single atomic document insertion 
    // and unique constraint on 'user' prevents races.
    const profile = await patientRepository.createProfile(newProfileData);

    auditService.logEvent('PATIENT_PROFILE_CREATED', userId, { patientId: profile._id });
    
    return profile;
  }

  /**
   * Retrieves the current user's Patient profile.
   */
  async getCurrentPatient(userId) {
    const profile = await patientRepository.findProfileByUser(userId);
    if (!profile) {
      throw new ApiError(404, 'Patient profile not found', 'NOT_FOUND');
    }
    return profile;
  }

  /**
   * Retrieves a specific Patient profile by ID, enforcing Server-Side Relationship Authorization.
   */
  async getPatientById(patientId, reqUser) {
    const profile = await patientRepository.findProfileById(patientId);
    if (!profile) {
      throw new ApiError(404, 'Patient profile not found or inactive', 'NOT_FOUND');
    }

    if (reqUser.role === 'admin') {
      auditService.logEvent('PATIENT_DATA_ACCESSED', reqUser._id, { patientId, role: reqUser.role });
      return profile; // Admin sees full profile
    }

    // Server-side Authorization via EmergencyRequest
    const isAuthorized = await this._authorizeProviderAccess(patientId, reqUser);
    if (!isAuthorized) {
      throw new ApiError(403, 'You are not authorized to access this patient\'s data', 'FORBIDDEN_RESOURCE');
    }

    auditService.logEvent('PATIENT_DATA_ACCESSED', reqUser._id, { patientId, role: reqUser.role });
    return this._projectProfileForRole(profile, reqUser.role);
  }

  /**
   * Updates demographics of current patient.
   */
  async updateProfile(userId, updateData) {
    const profile = await patientRepository.updateProfileByUserId(userId, updateData);
    if (!profile) {
      throw new ApiError(404, 'Patient profile not found', 'NOT_FOUND');
    }

    auditService.logEvent('PATIENT_PROFILE_UPDATED', userId, { updatedFields: Object.keys(updateData) });
    return profile;
  }

  /**
   * Update live location with timestamp protection.
   */
  async updateLiveLocation(userId, locationData) {
    const timestamp = locationData.timestamp ? new Date(locationData.timestamp) : new Date();
    
    const profile = await patientRepository.updateLocation(userId, locationData.location, timestamp);
    if (!profile) {
      // It could mean profile not found, OR stale update prevented (query did not match).
      // Since it's a high frequency fire-and-forget, we check if patient exists at all.
      const exists = await patientRepository.findProfileByUser(userId);
      if (!exists) throw new ApiError(404, 'Patient profile not found', 'NOT_FOUND');
      // If exists but didn't update, it was a stale update (locationUpdatedAt > newTimestamp). Ignore silently.
      return null; 
    }
    return profile;
  }

  /**
   * Update emergency contacts.
   */
  async updateEmergencyContacts(userId, contacts) {
    const normalizedContacts = this._normalizeContacts(contacts);
    
    const profile = await patientRepository.updateProfileByUserId(userId, { emergencyContacts: normalizedContacts });
    if (!profile) {
      throw new ApiError(404, 'Patient profile not found', 'NOT_FOUND');
    }

    auditService.logEvent('EMERGENCY_CONTACTS_UPDATED', userId, { count: normalizedContacts.length });
    return profile;
  }

  /**
   * Soft delete patient profile.
   */
  async softDeleteProfile(userId) {
    const profile = await patientRepository.softDeleteByUserId(userId);
    if (!profile) {
      throw new ApiError(404, 'Patient profile not found', 'NOT_FOUND');
    }
    
    // Soft delete user account
    await userRepository.updateById(userId, { isActive: false });
    
    // Revoke all sessions to enforce logout
    await sessionRepository.revokeAllUserSessions(userId);
    
    auditService.logEvent('PATIENT_PROFILE_DEACTIVATED', userId, { patientId: profile._id });
    return true;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  _normalizeContacts(contacts) {
    if (!contacts) return [];
    const uniquePhones = new Set();
    const normalized = [];

    for (const contact of contacts) {
      // Remove spaces, dashes, parentheses to normalize E.164-like phone logic
      let normalizedPhone = contact.phone.replace(/[\s\-\(\)]/g, '');
      if (!uniquePhones.has(normalizedPhone)) {
        uniquePhones.add(normalizedPhone);
        normalized.push({
          name: contact.name.trim(),
          phone: normalizedPhone,
          relation: contact.relation.trim()
        });
      }
    }
    return normalized;
  }

  async _authorizeProviderAccess(patientId, reqUser) {
    // Determine active emergency request involving this patient and the provider
    const activeStatuses = ['Pending', 'Accepted', 'En Route', 'Arrived', 'In Transit'];
    
    const baseQuery = { 
      patient: patientId, 
      isActive: true,
      status: { $in: activeStatuses } 
    };

    if (reqUser.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: reqUser._id, isActive: true });
      if (!doctor) return false;
      const query = {
        ...baseQuery,
        doctor: doctor._id
      };
      const emergency = await EmergencyRequest.findOne(query);
      return !!emergency;
    }

    if (reqUser.role === 'hospital') {
      const hospital = await Hospital.findOne({ admin: reqUser._id, isActive: true });
      if (!hospital) return false;
      const emergency = await EmergencyRequest.findOne({ ...baseQuery, hospital: hospital._id });
      return !!emergency;
    }

    if (reqUser.role === 'driver') {
      const ambulance = await Ambulance.findOne({ driver: reqUser._id, isActive: true });
      if (!ambulance) return false;
      const emergency = await EmergencyRequest.findOne({ ...baseQuery, ambulance: ambulance._id });
      return !!emergency;
    }

    return false;
  }

  _projectProfileForRole(profile, role) {
    const obj = profile.toObject ? profile.toObject() : profile;
    
    if (role === 'doctor') {
      return {
        _id: obj._id,
        dateOfBirth: obj.dateOfBirth,
        gender: obj.gender,
        bloodGroup: obj.bloodGroup,
        emergencyContacts: obj.emergencyContacts,
        location: obj.location
      };
    }
    
    if (role === 'hospital') {
      return {
        _id: obj._id,
        dateOfBirth: obj.dateOfBirth,
        gender: obj.gender,
        bloodGroup: obj.bloodGroup,
        emergencyContacts: obj.emergencyContacts
      };
    }
    
    if (role === 'driver') {
      return {
        _id: obj._id,
        dateOfBirth: obj.dateOfBirth,
        bloodGroup: obj.bloodGroup,
        location: obj.location // Needed for pickup mapping
      };
    }

    return obj;
  }
}

export const patientService = new PatientService();
