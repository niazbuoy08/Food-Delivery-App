import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, me } from '../controllers/authController.js';
import { requireAdmin } from '../middleware/auth.js';
import {
  adminListMenu,
  createMenuItem,
  deleteMenuItem,
  updateMenuItem,
} from '../controllers/menuController.js';
import {
  getOrder,
  getStats,
  listOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';

const router = Router();

// Slows password guessing to a crawl.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { success: false, message: 'Too many sign-in attempts. Try again in 15 minutes.' },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/auth/login', loginLimiter, login);

// Everything below this line requires a valid admin token.
router.use(requireAdmin);

router.get('/auth/me', me);
router.get('/stats', getStats);

router.get('/orders', listOrders);
router.get('/orders/:id', getOrder);
router.patch('/orders/:id/status', updateOrderStatus);

router.get('/menu', adminListMenu);
router.post('/menu', createMenuItem);
router.patch('/menu/:id', updateMenuItem);
router.delete('/menu/:id', deleteMenuItem);

export default router;
