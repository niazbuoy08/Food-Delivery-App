import mongoose from 'mongoose';
import { ALLERGENS, CATEGORIES } from '../constants.js';

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    description: { type: String, required: true, trim: true, maxlength: 300 },
    price: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
    category: { type: String, required: true, enum: CATEGORIES },
    image: { type: String, required: true, trim: true },
    isVeg: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false },
    prepTimeMins: { type: Number, default: 20, min: 1, max: 180 },
    allergens: { type: [{ type: String, enum: ALLERGENS }], default: [] },
  },
  { timestamps: true }
);

menuItemSchema.index({ category: 1, isAvailable: 1 });

export default mongoose.model('MenuItem', menuItemSchema);
