import mongoose, { Schema } from 'mongoose';

const ShopSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  currency: { type: String, default: 'INR' },
  taxRate: { type: Number, default: 0 },
  logoUrl: { type: String, default: '' },
  whatsappTemplateOrder: { 
    type: String, 
    default: 'Hello {patientName}, your order {orderNumber} has been booked successfully at {shopName}. Total Amount: {totalAmount}, Advance: {advanceAmount}, Balance: {balanceAmount}. Scheduled delivery: {deliveryDate}. View details: {receiptUrl} Thank you!' 
  },
  whatsappTemplateReady: { 
    type: String, 
    default: 'Hello {patientName}, your glasses/lenses for order {orderNumber} are ready for pickup at {shopName}. Remaining Balance: {balanceAmount}. View details: {receiptUrl} See you soon!' 
  },
  whatsappTemplateBalance: { 
    type: String, 
    default: 'Hello {patientName}, this is a friendly reminder from {shopName} regarding your pending balance of {balanceAmount} for order {orderNumber}. View details: {receiptUrl} Please make the payment at your convenience. Thank you!' 
  }
}, { timestamps: true });

export default mongoose.models.Shop || mongoose.model('Shop', ShopSchema);
