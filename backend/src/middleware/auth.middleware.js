import { userRepository } from '../repositories/user.repository.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';

export const authenticate = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } 

    if (!token) {
      return next(new ApiError(401, 'Authentication required', 'UNAUTHENTICATED'));
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      console.log('JWT Verify Error:', err.message);
      return next(new ApiError(401, 'Invalid or expired access token', 'TOKEN_INVALID'));
    }

    const currentUser = await userRepository.findByIdWithStatus(decoded.id || decoded.userId);
    if (!currentUser) {
      return next(new ApiError(401, 'User associated with this token no longer exists.', 'USER_NOT_FOUND'));
    }

    if (!currentUser.isActive) {
      return next(new ApiError(403, 'Account is disabled.', 'ACCOUNT_DISABLED'));
    }

    if (currentUser.isLocked) {
      return next(new ApiError(403, 'Account is locked.', 'ACCOUNT_LOCKED'));
    }

    if (decoded.tokenVersion !== undefined && currentUser.tokenVersion !== decoded.tokenVersion) {
      return next(new ApiError(401, 'Session is invalid or expired. Please log in again.', 'SESSION_INVALID'));
    }

    req.user = currentUser;
    req.token = decoded; // Store token payload for JTI access during logout
    next();
  } catch (error) {
    next(new ApiError(500, 'Internal Server Error during authentication.'));
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action', 'FORBIDDEN_ROLE'));
    }
    next();
  };
};

export const authorizePatientData = (req, res, next) => {
  const patientId = req.params.patientId || req.body.patientId;
  
  if (req.user.role === 'admin') return next();
  
  if (req.user.role === 'patient') {
    // Patients can only access their own data
    // Assuming patientId in params is the user _id for now, or we lookup Patient document
    // In a real scenario, compare Patient._id or Patient.user === req.user._id
    if (patientId !== req.user._id.toString()) {
      return next(new ApiError(403, 'You can only access your own data', 'FORBIDDEN_RESOURCE'));
    }
    return next();
  }

  if (req.user.role === 'doctor') {
    // Check if patient is in doctor's assigned list (mocked via req for testing, or a DB call in prod)
    if (req.assignedPatients && req.assignedPatients.includes(patientId)) {
      return next();
    }
    return next(new ApiError(403, 'You are not authorized to access this patient data', 'FORBIDDEN_RESOURCE'));
  }

  if (req.user.role === 'hospital') {
    if (req.assignedPatients && req.assignedPatients.includes(patientId)) {
      return next();
    }
    return next(new ApiError(403, 'Patient not assigned to this hospital', 'FORBIDDEN_RESOURCE'));
  }

  if (req.user.role === 'ambulance') {
    if (req.assignedPatients && req.assignedPatients.includes(patientId)) {
      return next();
    }
    return next(new ApiError(403, 'Patient not assigned to this ambulance', 'FORBIDDEN_RESOURCE'));
  }

  return next(new ApiError(403, 'Forbidden', 'FORBIDDEN_RESOURCE'));
};

export const authorizeHospitalData = (req, res, next) => {
  const hospitalId = req.params.hospitalId || req.body.hospitalId;
  if (req.user.role === 'admin') return next();

  if (req.user.role === 'hospital') {
    if (hospitalId !== req.user._id.toString()) {
      return next(new ApiError(403, 'You can only access your own hospital data', 'FORBIDDEN_ORGANIZATION'));
    }
    return next();
  }

  return next(new ApiError(403, 'Forbidden', 'FORBIDDEN_ORGANIZATION'));
};

export const authorizeEmergencyData = (req, res, next) => {
  const emergencyId = req.params.emergencyId || req.body.emergencyId;
  
  if (req.user.role === 'admin') return next();

  if (req.user.role === 'patient') {
    if (req.assignedEmergencies && req.assignedEmergencies.includes(emergencyId)) {
      return next();
    }
    return next(new ApiError(403, 'You can only access your own emergency data', 'FORBIDDEN_RESOURCE'));
  }

  if (req.user.role === 'ambulance' || req.user.role === 'hospital' || req.user.role === 'doctor') {
    if (req.assignedEmergencies && req.assignedEmergencies.includes(emergencyId)) {
      return next();
    }
    return next(new ApiError(403, `Emergency not assigned to this ${req.user.role}`, 'FORBIDDEN_RESOURCE'));
  }

  return next(new ApiError(403, 'Forbidden', 'FORBIDDEN_RESOURCE'));
};
