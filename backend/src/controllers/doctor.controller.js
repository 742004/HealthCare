import { BaseController } from '../core/BaseController.js';
import { doctorService } from '../services/doctor.service.js';

class DoctorController extends BaseController {
  constructor() {
    super(doctorService);
  }

  createProfile = this.execute(async (req, res) => {
    const profile = await this.service.createProfile(req.user._id, req.body);
    return this.sendCreated(res, profile, 'Doctor profile created successfully');
  });

  getCurrentDoctor = this.execute(async (req, res) => {
    const profile = await this.service.getCurrentDoctor(req.user._id);
    return this.sendSuccess(res, 200, profile, 'Current doctor profile retrieved');
  });

  getDoctorById = this.execute(async (req, res) => {
    const profile = await this.service.getProfile(req.params.id);
    // Public projection: hide sensitive data
    const publicProfile = {
      _id: profile._id,
      user: profile.user,
      specialization: profile.specialization,
      hospital: profile.hospital,
      experienceYears: profile.experienceYears,
      availabilityStatus: profile.availabilityStatus
    };
    return this.sendSuccess(res, 200, publicProfile, 'Doctor profile retrieved');
  });

  updateProfile = this.execute(async (req, res) => {
    const updatedProfile = await this.service.updateProfile(req.user._id, req.body);
    return this.sendSuccess(res, 200, updatedProfile, 'Doctor profile updated successfully');
  });

  updateAvailability = this.execute(async (req, res) => {
    const { status } = req.body;
    const profile = await this.service.updateAvailability(req.user._id, status);
    return this.sendSuccess(res, 200, profile, 'Availability updated successfully');
  });

  viewAssignedEmergencies = this.execute(async (req, res) => {
    const emergencies = await this.service.viewAssignedEmergencies(req.user._id);
    return this.sendSuccess(res, 200, emergencies, 'Assigned emergencies retrieved');
  });

  softDeleteProfile = this.execute(async (req, res) => {
    await this.service.deleteProfile(req.user._id);
    return this.sendSuccess(res, 200, null, 'Doctor profile deactivated successfully');
  });
}

export const doctorController = new DoctorController();
