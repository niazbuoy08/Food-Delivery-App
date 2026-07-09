// The order lifecycle, mirroring the customer flow:
// Place Order -> Restaurant Receives Order -> Prepare Food -> Delivery
export const ORDER_STATUS = {
  PLACED: 'PLACED',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

export const ORDER_STATUS_LIST = Object.values(ORDER_STATUS);

// Which statuses an order may move to next. Admin transitions are validated
// against this, so an order can't jump from PLACED straight to DELIVERED.
export const ALLOWED_TRANSITIONS = {
  [ORDER_STATUS.PLACED]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PREPARING]: [ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.OUT_FOR_DELIVERY]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: [],
};

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
};

export const PAYMENT_METHOD = {
  CARD: 'CARD',
  COD: 'COD',
};

export const CATEGORIES = ['Entrées', 'Plats', 'Fromages', 'Boulangerie', 'Desserts', 'Boissons'];

// The 14 allergens an EU food business must declare. Stored per dish and shown
// on the menu card.
export const ALLERGENS = [
  'Gluten',
  'Dairy',
  'Eggs',
  'Fish',
  'Shellfish',
  'Molluscs',
  'Nuts',
  'Peanuts',
  'Soy',
  'Celery',
  'Mustard',
  'Sesame',
  'Sulphites',
  'Lupin',
];

// Money, in euros. Kept server-side so the browser can never influence what a
// cart costs. TVA of 10% is the French rate on prepared food for takeaway.
export const DELIVERY_FEE = 3.5;
export const TAX_RATE = 0.1;
export const FREE_DELIVERY_THRESHOLD = 35;
export const MAX_QUANTITY_PER_ITEM = 20;
