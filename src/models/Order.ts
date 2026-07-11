import mongoose, { Schema } from 'mongoose';

const OrderSchema = new Schema({
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  orderNumber: { type: String, required: true, index: true },
  bookingDate: { type: Date, default: Date.now },
  deliveryDate: { type: Date, required: true },
  optometrist: { type: String, default: '' },
  
  prescription: {
    right: {
      sph: { type: String, default: '' },
      cyl: { type: String, default: '' },
      axis: { type: String, default: '' },
      vsn: { type: String, default: '' }, // e.g. 6/6, 6/9
      add: { type: String, default: '' }
    },
    left: {
      sph: { type: String, default: '' },
      cyl: { type: String, default: '' },
      axis: { type: String, default: '' },
      vsn: { type: String, default: '' }, // e.g. 6/6, 6/9
      add: { type: String, default: '' }
    }
  },
  
  // Frame, Lenses and other optical details
  ipd: { type: String, default: '' }, // Interpupillary Distance
  shapeChange: { type: String, enum: ['Yes', 'No', ''], default: '' }, // "Shape Change" field
  contactLens: { type: String, enum: ['Yes', 'No', ''], default: '' }, // "Contact Lence" field
  pendingWork: { type: String, default: '' }, // "Pending" notes / status
  
  frame: { type: String, default: '' }, // "FRAME" details
  lenses: { type: String, default: '' }, // "LENSES" details
  
  // Financial details
  financials: {
    amount: { type: Number, required: true, default: 0 },   // "AMOUNT"
    advance: { type: Number, required: true, default: 0 },  // "ADVANCE"
    balance: { type: Number, required: true, default: 0 }   // "BALANCE"
  },
  
  status: { 
    type: String, 
    enum: ['Ordered', 'In Lab', 'Ready', 'Delivered', 'Cancelled'], 
    default: 'Ordered' 
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Partial', 'Unpaid'],
    default: 'Unpaid'
  },
  notes: { type: String, default: '' },
  cashPaidSignature: { type: String, default: '' } // signature reference or acknowledgement
}, { timestamps: true });

// Auto-calculate balance and payment status before saving
OrderSchema.pre('save', function(this: any) {
  const amount = this.financials.amount || 0;
  const advance = this.financials.advance || 0;
  this.financials.balance = Math.max(0, amount - advance);
  
  if (this.financials.balance === 0 && amount > 0) {
    this.paymentStatus = 'Paid';
  } else if (advance > 0 && this.financials.balance > 0) {
    this.paymentStatus = 'Partial';
  } else {
    this.paymentStatus = 'Unpaid';
  }
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
