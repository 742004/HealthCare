import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital'
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      unique: true
    },
    experienceYears: {
      type: Number,
      required: true,
      min: [0, 'Experience cannot be negative']
    },
    availabilityStatus: {
      type: String,
      enum: ['Available', 'In Surgery', 'On Leave', 'Busy'],
      default: 'Available'
    },
    isVerified: {
      type: Boolean,
      default: false // Verified by hospital admin
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

doctorSchema.index({ user: 1 });
doctorSchema.index({ hospital: 1 });
doctorSchema.index({ specialization: 1 });

const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;
