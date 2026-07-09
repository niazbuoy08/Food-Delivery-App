// Mirrors server/src/constants.js. Keep the two in sync.
export const ORDER_STATUS = {
  PLACED: 'PLACED',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

export const STATUS_META = {
  PLACED: {
    label: 'Order placed',
    customerCopy: "We've got your order and sent it to the kitchen.",
    chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    dot: 'bg-blue-500',
  },
  CONFIRMED: {
    label: 'Restaurant confirmed',
    customerCopy: 'The restaurant accepted your order.',
    chip: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
    dot: 'bg-violet-500',
  },
  PREPARING: {
    label: 'In the kitchen',
    customerCopy: 'The brigade is on it. This is the part worth waiting for.',
    chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    dot: 'bg-amber-500',
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for delivery',
    customerCopy: 'Your food has left the restaurant and is on its way.',
    chip: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
    dot: 'bg-orange-500',
  },
  DELIVERED: {
    label: 'Delivered',
    customerCopy: 'Bon appétit.',
    chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  CANCELLED: {
    label: 'Cancelled',
    customerCopy: 'This order was cancelled.',
    chip: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    dot: 'bg-red-500',
  },
};

// The happy path, in order. Used to draw the tracking timeline.
export const TRACKING_STEPS = [
  ORDER_STATUS.PLACED,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERED,
];

export const ALLOWED_TRANSITIONS = {
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};
