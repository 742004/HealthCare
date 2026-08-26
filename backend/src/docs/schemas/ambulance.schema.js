/**
 * Ambulance OpenAPI Schemas
 * 
 * Defines the request and response structures for ambulance vehicles,
 * driver credentials, live tracking locations, and EMS equipment.
 */

export const ambulanceSchemas = Object.freeze({
  // ---------------------------------------------------------
  // Sub-components & Fragments
  // ---------------------------------------------------------
  DriverInformation: {
    type: 'object',
    properties: {
      licenseNumber: { type: 'string', example: 'DL-EMS-789456' },
      certificationLevel: { type: 'string', enum: ['EMT-Basic', 'EMT-Intermediate', 'Paramedic'], example: 'Paramedic' },
      yearsOfExperience: { type: 'integer', example: 8 },
      shiftEnd: { type: 'string', format: 'time', example: '18:00:00Z' },
    },
  },
  VehicleInformation: {
    type: 'object',
    properties: {
      vehicleNumber: { type: 'string', example: 'AMB-104' },
      licensePlate: { type: 'string', example: 'CA-987XYZ' },
      vehicleType: { type: 'string', enum: ['Type I', 'Type II', 'Type III', 'Helicopter'], example: 'Type III' },
      fuelLevel: { type: 'integer', description: 'Fuel level percentage', example: 85 },
      lastMaintained: { type: 'string', format: 'date', example: '2026-06-15' },
    },
  },
  MedicalEquipment: {
    type: 'array',
    items: { type: 'string' },
    example: ['Defibrillator', 'Oxygen Tanks', 'Ventilator', 'Trauma Kit', 'Spinal Board'],
    description: 'List of life-saving equipment currently on board',
  },
  CurrentLocation: {
    type: 'object',
    properties: {
      coordinates: { $ref: '#/components/schemas/Coordinates' },
      heading: { type: 'number', description: 'Direction of travel in degrees', example: 275.5 },
      speed: { type: 'number', description: 'Speed in mph', example: 45 },
      lastUpdated: { $ref: '#/components/schemas/Timestamp' },
    },
  },
  AvailabilityStatus: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['AVAILABLE', 'DISPATCHED', 'EN_ROUTE', 'AT_HOSPITAL', 'OUT_OF_SERVICE'], example: 'AVAILABLE' },
      isOnline: { type: 'boolean', example: true },
    },
  },
  TripInformation: {
    type: 'object',
    properties: {
      activeEmergencyId: { $ref: '#/components/schemas/ObjectId', nullable: true },
      destinationHospitalId: { $ref: '#/components/schemas/ObjectId', nullable: true },
      estimatedTimeOfArrival: { type: 'string', format: 'date-time', nullable: true, example: '2026-07-24T12:15:00.000Z' },
    },
  },
  AmbulanceStatistics: {
    type: 'object',
    properties: {
      totalTripsCompleted: { type: 'integer', example: 1432 },
      averageResponseTimeMinutes: { type: 'number', example: 6.5 },
      activeHoursThisWeek: { type: 'number', example: 42.5 },
    },
  },

  // ---------------------------------------------------------
  // Core Entities
  // ---------------------------------------------------------
  AmbulanceProfile: {
    type: 'object',
    properties: {
      id: { $ref: '#/components/schemas/ObjectId' },
      user: { $ref: '#/components/schemas/UserProfile', description: 'The driver authenticated user account' },
      driver: { $ref: '#/components/schemas/DriverInformation' },
      vehicle: { $ref: '#/components/schemas/VehicleInformation' },
      equipment: { $ref: '#/components/schemas/MedicalEquipment' },
      location: { $ref: '#/components/schemas/CurrentLocation' },
      availability: { $ref: '#/components/schemas/AvailabilityStatus' },
      trip: { $ref: '#/components/schemas/TripInformation' },
      hospitalAffiliation: { $ref: '#/components/schemas/ObjectId', nullable: true, description: 'ID of base hospital if not private' },
      statistics: { $ref: '#/components/schemas/AmbulanceStatistics' },
      createdAt: { $ref: '#/components/schemas/Timestamp' },
      updatedAt: { $ref: '#/components/schemas/Timestamp' },
    },
  },
  AmbulanceSummary: {
    type: 'object',
    properties: {
      id: { $ref: '#/components/schemas/ObjectId' },
      vehicleNumber: { type: 'string', example: 'AMB-104' },
      vehicleType: { type: 'string', example: 'Type III' },
      status: { type: 'string', example: 'AVAILABLE' },
      driverName: { type: 'string', example: 'Marcus Lee' },
      distance: { type: 'number', description: 'Calculated distance from emergency (if spatial query)', example: 1.2 },
    },
  },

  // ---------------------------------------------------------
  // Requests
  // ---------------------------------------------------------
  CreateAmbulanceRequest: {
    type: 'object',
    required: ['vehicle', 'driver', 'equipment'],
    properties: {
      vehicle: { $ref: '#/components/schemas/VehicleInformation' },
      driver: { $ref: '#/components/schemas/DriverInformation' },
      equipment: { $ref: '#/components/schemas/MedicalEquipment' },
      hospitalAffiliation: { $ref: '#/components/schemas/ObjectId' },
    },
  },
  UpdateAmbulanceRequest: {
    type: 'object',
    properties: {
      vehicle: { $ref: '#/components/schemas/VehicleInformation' },
      driver: { $ref: '#/components/schemas/DriverInformation' },
      equipment: { $ref: '#/components/schemas/MedicalEquipment' },
      availability: { $ref: '#/components/schemas/AvailabilityStatus' },
    },
  },
  UpdateLocationRequest: {
    type: 'object',
    required: ['coordinates'],
    properties: {
      coordinates: { $ref: '#/components/schemas/Coordinates' },
      heading: { type: 'number', example: 275.5 },
      speed: { type: 'number', example: 45 },
    },
  },
  AssignEmergencyRequest: {
    type: 'object',
    required: ['emergencyId'],
    properties: {
      emergencyId: { $ref: '#/components/schemas/ObjectId' },
      destinationHospitalId: { $ref: '#/components/schemas/ObjectId', nullable: true },
    },
  },

  // ---------------------------------------------------------
  // Responses
  // ---------------------------------------------------------
  AmbulanceResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              ambulance: { $ref: '#/components/schemas/AmbulanceProfile' },
            },
          },
        },
      },
    ],
  },
  AmbulanceListResponse: {
    allOf: [
      { $ref: '#/components/schemas/PaginationResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/AmbulanceSummary' },
          },
        },
      },
    ],
  },
});
