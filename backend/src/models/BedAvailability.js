import mongoose from 'mongoose';

const bedAvailabilitySchema = new mongoose.Schema(
  {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      unique: true // One availability record per hospital
    },
    totalBeds: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    occupiedBeds: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    totalICU: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    occupiedICU: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtuals to calculate available beds on the fly
bedAvailabilitySchema.virtual('availableBeds').get(function () {
  return this.totalBeds - this.occupiedBeds;
});

bedAvailabilitySchema.virtual('availableICU').get(function () {
  return this.totalICU - this.occupiedICU;
});

bedAvailabilitySchema.index({ hospital: 1 });

const BedAvailability = mongoose.model('BedAvailability', bedAvailabilitySchema);
export default BedAvailability;
