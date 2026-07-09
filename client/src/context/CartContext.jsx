import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

const STORAGE_KEY = 'tt_cart_v1';

// Kept in sync with the server. Displayed as an estimate; the server has the
// final say on what the customer is charged.
const DELIVERY_FEE = 3.5;
const FREE_DELIVERY_THRESHOLD = 35;
const TAX_RATE = 0.1;
const MAX_QTY = 20;

// Euro prices have cents, so float arithmetic drifts: 2.2 * 3 is 6.6000000000000005.
// Round every money value to cents before it reaches the UI.
const round2 = (n) => Math.round(n * 100) / 100;

function reducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const { item, quantity } = action;
      const existing = state.items.find((i) => i._id === item._id);

      if (existing) {
        const nextQty = Math.min(existing.quantity + quantity, MAX_QTY);
        return {
          ...state,
          items: state.items.map((i) => (i._id === item._id ? { ...i, quantity: nextQty } : i)),
        };
      }
      return { ...state, items: [...state.items, { ...item, quantity: Math.min(quantity, MAX_QTY) }] };
    }

    case 'SET_QTY': {
      // Dropping to zero removes the line, which is what the − button at qty 1 should do.
      if (action.quantity < 1) {
        return { ...state, items: state.items.filter((i) => i._id !== action.id) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i._id === action.id ? { ...i, quantity: Math.min(action.quantity, MAX_QTY) } : i
        ),
      };
    }

    case 'REMOVE':
      return { ...state, items: state.items.filter((i) => i._id !== action.id) };

    case 'CLEAR':
      return { ...state, items: [] };

    case 'SET_CHECKOUT':
      return { ...state, checkout: { ...state.checkout, ...action.details } };

    case 'HYDRATE':
      return action.state;

    default:
      return state;
  }
}

const EMPTY_CHECKOUT = {
  name: '',
  phone: '',
  email: '',
  line1: '',
  line2: '',
  city: '',
  postalCode: '',
  landmark: '',
  deliveryNotes: '',
};

const initialState = { items: [], checkout: EMPTY_CHECKOUT };

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;

    const parsed = JSON.parse(raw);
    // Guard against a malformed or older-shaped payload left in localStorage.
    if (!Array.isArray(parsed?.items)) return initialState;

    return {
      items: parsed.items.filter((i) => i?._id && i?.price >= 0 && i?.quantity > 0),
      checkout: { ...EMPTY_CHECKOUT, ...(parsed.checkout || {}) },
    };
  } catch {
    return initialState;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, loadFromStorage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addItem = useCallback((item, quantity = 1) => {
    dispatch({ type: 'ADD', item, quantity });
    toast.success(`${item.name} added to cart`, { id: `add-${item._id}` });
  }, []);

  const setQuantity = useCallback((id, quantity) => dispatch({ type: 'SET_QTY', id, quantity }), []);
  const removeItem = useCallback((id) => dispatch({ type: 'REMOVE', id }), []);
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), []);
  const setCheckout = useCallback((details) => dispatch({ type: 'SET_CHECKOUT', details }), []);

  const totals = useMemo(() => {
    const subtotal = round2(state.items.reduce((sum, i) => sum + i.price * i.quantity, 0));
    const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : DELIVERY_FEE;
    const tax = round2(subtotal * TAX_RATE);

    return {
      subtotal,
      deliveryFee,
      tax,
      total: round2(subtotal + deliveryFee + tax),
      itemCount: state.items.reduce((sum, i) => sum + i.quantity, 0),
      amountToFreeDelivery: round2(Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal)),
    };
  }, [state.items]);

  const value = useMemo(
    () => ({
      items: state.items,
      checkout: state.checkout,
      totals,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      setCheckout,
      quantityOf: (id) => state.items.find((i) => i._id === id)?.quantity ?? 0,
    }),
    [state.items, state.checkout, totals, addItem, setQuantity, removeItem, clearCart, setCheckout]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}

export { FREE_DELIVERY_THRESHOLD, MAX_QTY };
