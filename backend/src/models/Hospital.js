import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
      index: true
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true
    },
    contactNumber: {
      type: String,
      required: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    },
    facilities: [
      {
        type: String,
        trim: true
      }
    ],
    status: {
      type: String,
      enum: ['Active', 'Suspended', 'Pending Verification'],
      default: 'Pending Verification'
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

hospitalSchema.index({ location: '2dsphere' });
hospitalSchema.index({ admin: 1 });

const Hospital = mongoose.model('Hospital', hospitalSchema);
export default Hospital;
