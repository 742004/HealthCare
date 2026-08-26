import { BaseController } from '../core/BaseController.js';
import { patientService } from '../services/patient.service.js';

class PatientController extends BaseController {
  constructor() {
    super(patientService);
  }

  createProfile = this.execute(async (req, res) => {
    const profile = await this.service.createProfile(req.user._id, req.body);
    return this.sendCreated(res, profile, 'Patient profile created successfully');
  });

  getCurrentPatient = this.execute(async (req, res) => {
    const profile = await this.service.getCurrentPatient(req.user._id);
    return this.sendSuccess(res, 200, profile, 'Current patient profile retrieved');
  });

  getPatientById = this.execute(async (req, res) => {
    const profile = await this.service.getPatientById(req.params.id, req.user);
    return this.sendSuccess(res, 200, profile, 'Patient profile retrieved');
  });

  updateProfile = this.execute(async (req, res) => {
    const updatedProfile = await this.service.updateProfile(req.user._id, req.body);
    return this.sendSuccess(res, 200, updatedProfile, 'Patient profile updated successfully');
  });

  updateLiveLocation = this.execute(async (req, res) => {
    await this.service.updateLiveLocation(req.user._id, req.body);
    return this.sendSuccess(res, 200, null, 'Live location updated');
  });

  updateEmergencyContacts = this.execute(async (req, res) => {
    const updatedProfile = await this.service.updateEmergencyContacts(req.user._id, req.body.contacts);
    return this.sendSuccess(res, 200, updatedProfile, 'Emergency contacts updated successfully');
  });

  softDeleteProfile = this.execute(async (req, res) => {
    await this.service.softDeleteProfile(req.user._id);
    return this.sendSuccess(res, 200, null, 'Patient profile deactivated successfully');
  });
}

export const patientController = new PatientController();
