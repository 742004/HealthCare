import express from 'express';
import mapsController from '../controllers/maps.controller.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { mapsValidation } from '../validations/maps.validation.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import mapsRateLimit from '../middleware/mapsRateLimit.js';

/**
 * Maps Routes
 * 
 * Defines endpoints for all geospatial and Google Maps capabilities.
 */
const router = express.Router();

router.use(mapsRateLimit);
router.use(protect);

router.post('/geocode', validateRequest(mapsValidation.geocodeSchema), mapsController.geocode);
router.post('/reverse-geocode', validateRequest(mapsValidation.coordinateSchema), mapsController.reverseGeocode);
router.post('/directions', validateRequest(mapsValidation.routeSchema), mapsController.directions);
router.post('/distance', validateRequest(mapsValidation.routeSchema), mapsController.distance);
router.post('/eta', validateRequest(mapsValidation.routeSchema), mapsController.eta);
router.post('/route', validateRequest(mapsValidation.routeSchema), mapsController.route);

router.post('/nearby/hospitals', validateRequest(mapsValidation.nearbySchema), mapsController.nearbyHospitals);
router.post('/nearby/ambulances', validateRequest(mapsValidation.nearbySchema), mapsController.nearbyAmbulances);
router.post('/nearby/doctors', validateRequest(mapsValidation.nearbySchema), mapsController.nearbyDoctors);

router.post('/track', 
  authorize('AMBULANCE', 'PATIENT', 'ADMIN'), 
  validateRequest(mapsValidation.trackSchema), 
  mapsController.track
);

export default router;
