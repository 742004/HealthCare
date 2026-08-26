import { jest } from '@jest/globals';
import { authorize, authorizePatientData, authorizeHospitalData, authorizeEmergencyData } from '../../src/middleware/auth.middleware.js';
import { ApiError } from '../../src/utils/ApiError.js';

describe('Authorization Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: {}, params: {}, body: {} };
    res = {};
    next = jest.fn();
  });

  describe('authorize() - RBAC', () => {
    it('should allow access if user has required role', () => {
      req.user.role = 'doctor';
      const middleware = authorize('doctor', 'admin');
      
      middleware(req, res, next);
      expect(next).toHaveBeenCalledWith(); // success
    });

    it('should deny access if user lacks required role', () => {
      req.user.role = 'patient';
      const middleware = authorize('doctor', 'admin');
      
      middleware(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next.mock.calls[0][0].statusCode).toBe(403);
      expect(next.mock.calls[0][0].errorCode).toBe('FORBIDDEN_ROLE');
    });
  });

  describe('authorizePatientData() - IDOR Prevention', () => {
    it('should allow patient to access their own data', () => {
      req.user = { _id: 'patient123', role: 'patient' };
      req.params.patientId = 'patient123';
      
      authorizePatientData(req, res, next);
      expect(next).toHaveBeenCalledWith(); // success
    });

    it('should deny patient from accessing another patient data (IDOR)', () => {
      req.user = { _id: 'patient123', role: 'patient' };
      req.params.patientId = 'patient456';
      
      authorizePatientData(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next.mock.calls[0][0].statusCode).toBe(403);
    });

    it('should allow admin to access any patient data', () => {
      req.user = { _id: 'admin123', role: 'admin' };
      req.params.patientId = 'patient456';
      
      authorizePatientData(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should allow doctor to access authorized patient data', () => {
      req.user = { _id: 'doc1', role: 'doctor' };
      req.params = { patientId: '456' };
      req.assignedPatients = ['456'];
      authorizePatientData(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should deny doctor from accessing unrelated patient data', () => {
      req.user = { _id: 'doc1', role: 'doctor' };
      req.params = { patientId: '456' };
      req.assignedPatients = ['789']; // another patient
      authorizePatientData(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    });

    it('should allow ambulance driver to access assigned patient data', () => {
      req.user = { _id: 'amb1', role: 'ambulance' };
      req.params = { patientId: '456' };
      req.assignedPatients = ['456'];
      authorizePatientData(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should deny ambulance driver from accessing unrelated patient data', () => {
      req.user = { _id: 'amb1', role: 'ambulance' };
      req.params = { patientId: '456' };
      req.assignedPatients = [];
      authorizePatientData(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    });
  });

  describe('authorizeHospitalData()', () => {
    it('should allow hospital to access their own resources', () => {
      req.user = { _id: 'hospital123', role: 'hospital' };
      req.params.hospitalId = 'hospital123';
      
      authorizeHospitalData(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should deny hospital from accessing another hospital resources', () => {
      req.user = { _id: 'hospital123', role: 'hospital' };
      req.params.hospitalId = 'hospital456';
      
      authorizeHospitalData(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    });
  });

  describe('authorizeEmergencyData() - Cross-Emergency Access Denial', () => {
    it('should allow hospital to access authorized emergency data', () => {
      req.user = { _id: 'hosp1', role: 'hospital' };
      req.params = { emergencyId: 'em1' };
      req.assignedEmergencies = ['em1'];
      authorizeEmergencyData(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should deny hospital from accessing unrelated emergency data', () => {
      req.user = { _id: 'hosp1', role: 'hospital' };
      req.params = { emergencyId: 'em1' };
      req.assignedEmergencies = ['em2'];
      authorizeEmergencyData(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    });

    it('should deny privilege escalation attempts (e.g. patient pretending to be hospital in scoping)', () => {
      req.user = { _id: 'pat1', role: 'patient' };
      req.params = { emergencyId: 'em1' };
      req.assignedEmergencies = []; // not assigned to patient
      authorizeEmergencyData(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    });
  });
});
