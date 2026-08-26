# Database Audit

- **Models Present:** Ambulance, BedAvailability, ChatMessage, DeviceToken, Doctor, EmergencyRequest, Hospital, MedicalRecord, Notification, NotificationHistory, NotificationPreference, Patient, User.
- **Missing Architecture:** **NO REPOSITORY LAYER EXISTS**.
  - All services currently import Mongoose models directly (e.g., `const User = require('../models/User')`).
  - `backend/src/repositories/` directory does not exist.
- **Transactions:** `EmergencyService` attempts to use `mongoose.startSession()`, but the internal `EmergencyRepository` calls are stubbed to return `null`.
- **Geospatial Indexes:** `Ambulance` and `Hospital` models likely have 2dsphere indexes, but real routing is mocked.
