import { Router } from 'express';
import authRoutes from './auth.routes.js';
import patientRoutes from './patient.routes.js';
import doctorRoutes from './doctor.routes.js';
import hospitalRoutes from './hospital.routes.js';
import ambulanceRoutes from './ambulance.routes.js';
import emergencyRoutes from './emergency.routes.js';
import medicalRecordRoutes from './medicalRecord.routes.js';
import notificationRoutes from './notification.routes.js';
import chatRoutes from './chat.routes.js';
import aiRoutes from './ai.routes.js';
import mapsRoutes from './maps.routes.js';
import firebaseRoutes from './firebase.routes.js';

const router = Router();

/**
 * ============================================================================
 * API ROUTE MOUNTING (Module 7 Aggregate)
 * Combines all modular routes into a single export for app.js.
 * ============================================================================
 */

router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/hospitals', hospitalRoutes);
router.use('/ambulances', ambulanceRoutes);
router.use('/emergencies', emergencyRoutes);
router.use('/medical-records', medicalRecordRoutes);
router.use('/notifications', notificationRoutes);
router.use('/chat', chatRoutes);
router.use('/ai', aiRoutes);
router.use('/maps', mapsRoutes);
router.use('/firebase', firebaseRoutes);

export default router;
