import mongoose, { Schema } from 'mongoose';

const StaffSchema = new Schema({
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['Doctor', 'Staff'], required: true, default: 'Doctor' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  qualification: { type: String, default: '' }, // e.g. B.Optom, Ophthalmologist
  isMainDoctor: { type: Boolean, default: false }, // Only one doctor should be the prefilled default
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Staff || mongoose.model('Staff', StaffSchema);
