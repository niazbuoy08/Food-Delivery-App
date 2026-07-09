import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createOrder, trackOrder } from '../controllers/orderController.js';

const router = Router();

// Placing an order is unauthenticated, so cap how fast one IP can do it.
const placeOrderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  message: { success: false, message: 'Too many orders from this device. Please wait a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Guessing order numbers should be slow.
const trackLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

router.post('/', placeOrderLimiter, createOrder);
router.get('/:orderNumber', trackLimiter, trackOrder);

export default router;
