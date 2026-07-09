import Order from '../models/Order.js';
import { generateOrderNumber, priceCart } from '../utils/pricing.js';
import { chargeCard } from '../utils/mockPayment.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import {
  ALLOWED_TRANSITIONS,
  ORDER_STATUS,
  ORDER_STATUS_LIST,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} from '../constants.js';

// POST /api/orders  (public — no customer account by design)
export const createOrder = asyncHandler(async (req, res) => {
  const { customer, address, items, payment = {}, deliveryNotes = '' } = req.body;

  if (!customer?.name?.trim()) throw new ApiError(400, 'Please tell us your name.');
  if (!/^[\d\s+()-]{7,20}$/.test(String(customer?.phone || ''))) {
    throw new ApiError(400, 'Please enter a valid phone number.');
  }
  if (!address?.line1?.trim() || !address?.city?.trim() || !address?.postalCode?.trim()) {
    throw new ApiError(400, 'A street address, city and postal code are all required.');
  }

  // Prices come from the database, never from the request body.
  const { items: pricedItems, subtotal, deliveryFee, tax, total, estimatedMins } =
    await priceCart(items);

  const method = payment.method === PAYMENT_METHOD.COD ? PAYMENT_METHOD.COD : PAYMENT_METHOD.CARD;

  // Charge before writing the order, so a declined card leaves nothing behind.
  let paymentResult = { transactionId: '', cardLast4: '' };
  if (method === PAYMENT_METHOD.CARD) {
    paymentResult = await chargeCard(payment);
  }

  const order = await createWithUniqueOrderNumber({
    customer: {
      name: customer.name.trim(),
      phone: customer.phone.trim(),
      email: customer.email?.trim().toLowerCase() || '',
    },
    address,
    items: pricedItems,
    subtotal,
    deliveryFee,
    tax,
    total,
    estimatedMins,
    deliveryNotes: String(deliveryNotes).slice(0, 300),
    payment: {
      method,
      status: method === PAYMENT_METHOD.CARD ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PENDING,
      transactionId: paymentResult.transactionId,
      cardLast4: paymentResult.cardLast4,
      paidAt: method === PAYMENT_METHOD.CARD ? new Date() : undefined,
    },
    status: ORDER_STATUS.PLACED,
    statusHistory: [{ status: ORDER_STATUS.PLACED, at: new Date() }],
  });

  res.status(201).json({ success: true, order });
});

// Order numbers are random, so a collision is vanishingly unlikely — but a
// duplicate-key error would surface to the customer as a failed order after
// their card was already charged. Retry instead.
async function createWithUniqueOrderNumber(payload, attempts = 5) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await Order.create({ ...payload, orderNumber: generateOrderNumber() });
    } catch (err) {
      const isDuplicateOrderNumber = err.code === 11000 && err.keyPattern?.orderNumber;
      if (!isDuplicateOrderNumber || i === attempts - 1) throw err;
    }
  }
}

// GET /api/orders/:orderNumber  (public — this is the tracking link)
export const trackOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    orderNumber: req.params.orderNumber.toUpperCase().trim(),
  }).select('-payment.transactionId');

  if (!order) throw new ApiError(404, 'We could not find an order with that number.');
  res.json({ success: true, order });
});

// --- Admin ---

// GET /api/admin/orders?status=&page=&limit=
export const listOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const filter = {};

  if (req.query.status && ORDER_STATUS_LIST.includes(req.query.status)) {
    filter.status = req.query.status;
  }
  if (req.query.search?.trim()) {
    const safe = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { orderNumber: { $regex: safe, $options: 'i' } },
      { 'customer.name': { $regex: safe, $options: 'i' } },
      { 'customer.phone': { $regex: safe, $options: 'i' } },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

// GET /api/admin/orders/:id
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found.');
  res.json({ success: true, order });
});

// PATCH /api/admin/orders/:id/status
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, cancelReason = '' } = req.body;

  if (!ORDER_STATUS_LIST.includes(status)) throw new ApiError(400, `"${status}" is not a valid status.`);

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found.');

  const allowed = ALLOWED_TRANSITIONS[order.status];
  if (!allowed.includes(status)) {
    throw new ApiError(
      409,
      allowed.length
        ? `An order that is ${label(order.status)} can only move to ${allowed.map(label).join(' or ')}.`
        : `This order is ${label(order.status)} and can no longer change.`
    );
  }

  order.status = status;
  order.statusHistory.push({ status, at: new Date() });

  if (status === ORDER_STATUS.CANCELLED) {
    order.cancelReason = String(cancelReason).slice(0, 200);
    if (order.payment.status === PAYMENT_STATUS.PAID) {
      // A real build would call the gateway's refund endpoint here.
      order.payment.status = PAYMENT_STATUS.FAILED;
    }
  }

  // Cash is collected at the door.
  if (status === ORDER_STATUS.DELIVERED && order.payment.method === PAYMENT_METHOD.COD) {
    order.payment.status = PAYMENT_STATUS.PAID;
    order.payment.paidAt = new Date();
  }

  await order.save();
  res.json({ success: true, order });
});

// GET /api/admin/stats — the dashboard tiles.
export const getStats = asyncHandler(async (_req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const activeStatuses = [
    ORDER_STATUS.PLACED,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.OUT_FOR_DELIVERY,
  ];

  const [todayAgg, activeCount, newCount, byStatus, topItems] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfToday }, status: { $ne: ORDER_STATUS.CANCELLED } } },
      { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
    ]),
    Order.countDocuments({ status: { $in: activeStatuses } }),
    Order.countDocuments({ status: ORDER_STATUS.PLACED }),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.name', qty: { $sum: '$items.quantity' } } },
      { $sort: { qty: -1 } },
      { $limit: 5 },
    ]),
  ]);

  res.json({
    success: true,
    stats: {
      // Rounded to cents, not whole euros — a day's takings are rarely round.
      todayRevenue: Math.round((todayAgg[0]?.revenue || 0) * 100) / 100,
      todayOrders: todayAgg[0]?.orders || 0,
      activeOrders: activeCount,
      newOrders: newCount,
      byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
      topItems: topItems.map((t) => ({ name: t._id, qty: t.qty })),
    },
  });
});

const label = (status) => status.toLowerCase().replace(/_/g, ' ');
