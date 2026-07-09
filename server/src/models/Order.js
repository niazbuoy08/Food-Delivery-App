import mongoose from 'mongoose';
import {
  ORDER_STATUS,
  ORDER_STATUS_LIST,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} from '../constants.js';

// Each line stores its own name/price rather than only a reference. If the
// restaurant later renames a dish or raises its price, past orders still show
// what the customer actually saw and paid.
const orderItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, required: true, trim: true, maxlength: 120 },
    line2: { type: String, trim: true, maxlength: 120, default: '' },
    city: { type: String, required: true, trim: true, maxlength: 60 },
    postalCode: { type: String, required: true, trim: true, maxlength: 12 },
    landmark: { type: String, trim: true, maxlength: 120, default: '' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },

    customer: {
      name: { type: String, required: true, trim: true, maxlength: 80 },
      phone: { type: String, required: true, trim: true, maxlength: 20 },
      email: { type: String, trim: true, lowercase: true, default: '' },
    },

    address: { type: addressSchema, required: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(v) => v.length > 0, 'Order must contain at least one item'],
    },

    // All computed server-side in the order controller.
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },

    payment: {
      method: { type: String, enum: Object.values(PAYMENT_METHOD), default: PAYMENT_METHOD.CARD },
      status: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.PENDING },
      transactionId: { type: String, default: '' },
      cardLast4: { type: String, default: '' },
      paidAt: { type: Date },
    },

    status: { type: String, enum: ORDER_STATUS_LIST, default: ORDER_STATUS.PLACED, index: true },
    statusHistory: [
      {
        status: { type: String, enum: ORDER_STATUS_LIST },
        at: { type: Date, default: Date.now },
        _id: false,
      },
    ],

    deliveryNotes: { type: String, trim: true, maxlength: 300, default: '' },
    estimatedMins: { type: Number, default: 40 },
    cancelReason: { type: String, trim: true, maxlength: 200, default: '' },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'customer.phone': 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);
