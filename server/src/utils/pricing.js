import crypto from 'crypto';
import MenuItem from '../models/MenuItem.js';
import { ApiError } from '../utils/ApiError.js';
import {
  DELIVERY_FEE,
  FREE_DELIVERY_THRESHOLD,
  MAX_QUANTITY_PER_ITEM,
  TAX_RATE,
} from '../constants.js';

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Rebuilds a cart from the database and prices it.
 *
 * The client sends only ids and quantities. Names and prices are read fresh from
 * Mongo, so a tampered request body cannot change what anything costs.
 */
export async function priceCart(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new ApiError(400, 'Your cart is empty.');
  }

  // Collapse duplicate lines for the same dish into one.
  const quantities = new Map();
  for (const line of rawItems) {
    const id = String(line?.menuItem ?? line?._id ?? '');
    const qty = Number(line?.quantity);

    if (!id) throw new ApiError(400, 'A cart item is missing its menu item id.');
    if (!Number.isInteger(qty) || qty < 1) {
      throw new ApiError(400, 'Quantities must be whole numbers of at least 1.');
    }

    const next = (quantities.get(id) || 0) + qty;
    if (next > MAX_QUANTITY_PER_ITEM) {
      throw new ApiError(400, `You can order at most ${MAX_QUANTITY_PER_ITEM} of any one dish.`);
    }
    quantities.set(id, next);
  }

  const found = await MenuItem.find({ _id: { $in: [...quantities.keys()] } });

  if (found.length !== quantities.size) {
    throw new ApiError(400, 'One of the dishes in your cart no longer exists.');
  }

  const unavailable = found.filter((item) => !item.isAvailable);
  if (unavailable.length) {
    const names = unavailable.map((i) => i.name).join(', ');
    throw new ApiError(409, `Sorry — ${names} just sold out. Please remove it and try again.`);
  }

  const items = found.map((item) => ({
    menuItem: item._id,
    name: item.name,
    price: item.price,
    quantity: quantities.get(String(item._id)),
    image: item.image,
  }));

  const subtotal = round2(items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const tax = round2(subtotal * TAX_RATE);
  const total = round2(subtotal + deliveryFee + tax);

  // Longest prep time in the cart, plus travel.
  const estimatedMins = Math.max(...found.map((i) => i.prepTimeMins)) + 15;

  return { items, subtotal, deliveryFee, tax, total, estimatedMins };
}

// Human-friendly, unguessable-ish, and easy to read over the phone.
// Ambiguous characters (0/O, 1/I) are excluded.
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateOrderNumber() {
  const bytes = crypto.randomBytes(6);
  let code = '';
  for (const byte of bytes) code += ALPHABET[byte % ALPHABET.length];
  return `BL-${code}`;
}
