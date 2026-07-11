import mongoose, { Schema } from 'mongoose';

const PatientSchema = new Schema({
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, required: true, index: true },
  email: { type: String, default: '' },
  age: { type: Number },
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
  address: { type: String, default: '' },
  code: { type: String, default: '' }, // Unique code or card number for the patient
  notes: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.models.Patient || mongoose.model('Patient', PatientSchema);
