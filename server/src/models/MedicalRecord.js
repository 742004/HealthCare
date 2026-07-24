import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital'
    },
    diagnosis: {
      type: String,
      required: true
    },
    prescription: [
      {
        medicineName: { type: String, required: true },
        dosage: { type: String, required: true },
        duration: { type: String, required: true },
        notes: String
      }
    ],
    testResults: [
      {
        testName: String,
        resultUrl: String, // URL to uploaded file/PDF
        dateConducted: Date
      }
    ],
    treatmentDate: {
      type: Date,
      default: Date.now
    },
    notes: String,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

medicalRecordSchema.index({ patient: 1 });
medicalRecordSchema.index({ doctor: 1 });

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);
export default MedicalRecord;
