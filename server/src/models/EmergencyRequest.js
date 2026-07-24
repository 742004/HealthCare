import mongoose from 'mongoose';

const emergencyRequestSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital'
    },
    ambulance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ambulance'
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    pickupLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      },
      address: String
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'En Route', 'Arrived', 'In Transit', 'Completed', 'Cancelled'],
      default: 'Pending'
    },
    aiSeverityScore: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    symptoms: [String],
    aiFirstAidInstructions: String,
    estimatedArrivalTime: Date,
    completionTime: Date,
    isActive: {
      type: Boolean,
      default: true // False if soft deleted/archived
    }
  },
  {
    timestamps: true
  }
);

// Indexes
emergencyRequestSchema.index({ patient: 1 });
emergencyRequestSchema.index({ hospital: 1 });
emergencyRequestSchema.index({ ambulance: 1 });
emergencyRequestSchema.index({ status: 1 });

const EmergencyRequest = mongoose.model('EmergencyRequest', emergencyRequestSchema);
export default EmergencyRequest;
