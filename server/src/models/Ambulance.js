import mongoose from 'mongoose';

const ambulanceSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: false // Some ambulances might be independent
    },
    vehicleNumber: {
      type: String,
      required: true,
      unique: true
    },
    vehicleType: {
      type: String,
      enum: ['Basic Life Support (BLS)', 'Advanced Life Support (ALS)', 'Patient Transport'],
      required: true
    },
    equipmentLevel: [
      {
        type: String
      }
    ],
    status: {
      type: String,
      enum: ['Available', 'On Route', 'Busy', 'Off Duty', 'Maintenance'],
      default: 'Off Duty'
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

ambulanceSchema.index({ location: '2dsphere' });
ambulanceSchema.index({ driver: 1 });
ambulanceSchema.index({ status: 1 });

const Ambulance = mongoose.model('Ambulance', ambulanceSchema);
export default Ambulance;
