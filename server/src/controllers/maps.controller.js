import mapsService from '../services/maps.service.js';
import routeOptimizationService from '../services/routeOptimization.service.js';
import trackingService from '../services/tracking.service.js';
import { asyncHandler as catchAsync } from '../utils/asyncHandler.js';

/**
 * Maps Controller
 * 
 * Exposes Google Maps capabilities as REST API endpoints.
 */
class MapsController {
  
  geocode = catchAsync(async (req, res) => {
    const coords = await mapsService.getCoordinates(req.body.address);
    res.status(200).json({ success: true, data: coords });
  });

  reverseGeocode = catchAsync(async (req, res) => {
    const address = await mapsService.getAddress(req.body.lat, req.body.lng);
    res.status(200).json({ success: true, data: { address } });
  });

  directions = catchAsync(async (req, res) => {
    const routes = await mapsService.getDirections(req.body.origin, req.body.destination, req.body.options);
    res.status(200).json({ success: true, data: routes });
  });

  distance = catchAsync(async (req, res) => {
    const matrix = await mapsService.calculateDistance(req.body.origin, req.body.destination);
    res.status(200).json({ success: true, data: matrix });
  });

  eta = catchAsync(async (req, res) => {
    const duration = await routeOptimizationService.estimateTravelTime(req.body.origin, req.body.destination);
    const arrivalTime = await routeOptimizationService.estimateArrival(req.body.origin, req.body.destination);
    res.status(200).json({ success: true, data: { duration, arrivalTime } });
  });

  route = catchAsync(async (req, res) => {
    const route = await routeOptimizationService.optimizeRoute(req.body.origin, req.body.destination, req.body.waypoints);
    res.status(200).json({ success: true, data: route });
  });

  nearbyHospitals = catchAsync(async (req, res) => {
    const hospitals = await mapsService.findNearbyHospitals(req.body.lat, req.body.lng, req.body.radius);
    res.status(200).json({ success: true, data: hospitals });
  });

  nearbyAmbulances = catchAsync(async (req, res) => {
    const ambulances = await mapsService.findNearbyAmbulances(req.body.lat, req.body.lng, req.body.radius);
    res.status(200).json({ success: true, data: ambulances });
  });

  nearbyDoctors = catchAsync(async (req, res) => {
    const doctors = await mapsService.findNearbyDoctors(req.body.lat, req.body.lng, req.body.radius);
    res.status(200).json({ success: true, data: doctors });
  });

  track = catchAsync(async (req, res) => {
    const { entityType, entityId, coordinates, heading, speed } = req.body;
    
    if (entityType === 'AMBULANCE') {
      await trackingService.updateAmbulanceLocation(entityId, coordinates, heading, speed);
    } else if (entityType === 'PATIENT') {
      await trackingService.trackPatient(entityId, coordinates);
    }
    
    res.status(200).json({ success: true, message: 'Location broadcasted successfully' });
  });
}

export default new MapsController();
