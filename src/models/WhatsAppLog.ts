import mongoose from 'mongoose';

const whatsappLogSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  phone: { type: String, required: true },
  message: { type: String, required: true },
  recipientName: { type: String },
  type: { type: String, required: true }, // 'broadcast' | 'order_msg' | 'ready_msg' | 'balance_msg'
  status: { type: String, required: true }, // 'success' | 'failed'
  error: { type: String },
  createdAt: { type: Date, default: Date.now, index: { expires: '90d' } } // Automatic 90 days TTL expiration
}, {
  capped: { 
    size: 10 * 1024 * 1024, // 10 MB maximum storage size
    max: 50000              // 50,000 maximum logs count cap
  },
  timestamps: true
});

const WhatsAppLog = mongoose.models.WhatsAppLog || mongoose.model('WhatsAppLog', whatsappLogSchema);
export default WhatsAppLog;
