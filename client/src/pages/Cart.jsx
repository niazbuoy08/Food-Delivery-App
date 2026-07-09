import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatMoney } from '../lib/format';
import OrderSummary from '../components/OrderSummary';
import CheckoutSteps from '../components/CheckoutSteps';

export default function Cart() {
  const { items, totals, setQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-ink-100 text-ink-400">
          <ShoppingBag size={28} />
        </span>
        <h1 className="mt-6 font-display text-2xl font-extrabold">Your cart is empty</h1>
        <p className="mt-2 text-ink-600">
          Add a dish or two from the menu and they'll show up here.
        </p>
        <Link to="/menu" className="btn-primary btn-lg mt-8">
          Browse the menu <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <CheckoutSteps current={0} />

      <h1 className="font-display text-3xl font-extrabold">Your cart</h1>
      <p className="mt-1.5 text-sm text-ink-600">
        {totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'} · delivered in about 30–40 minutes
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.li
                key={item._id}
                layout
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                className="card flex gap-4 overflow-hidden p-3 sm:p-4"
              >
                <img
                  src={item.image}
                  alt=""
                  className="h-24 w-24 shrink-0 rounded-xl object-cover sm:h-28 sm:w-28"
                />

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-base font-bold">{item.name}</h2>
                      <p className="mt-0.5 text-sm text-ink-400">{formatMoney(item.price)} each</p>
                    </div>

                    <button
                      onClick={() => removeItem(item._id)}
                      aria-label={`Remove ${item.name} from cart`}
                      className="shrink-0 rounded-lg p-2 text-ink-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                    <div className="flex items-center rounded-lg border border-ink-100">
                      <button
                        onClick={() => setQuantity(item._id, item.quantity - 1)}
                        aria-label={`Decrease ${item.name}`}
                        className="grid h-9 w-9 place-items-center rounded-l-lg text-ink-600 transition hover:bg-ink-50"
                      >
                        <Minus size={15} />
                      </button>
                      <span className="w-9 text-center font-display text-sm font-bold" aria-live="polite">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(item._id, item.quantity + 1)}
                        aria-label={`Increase ${item.name}`}
                        className="grid h-9 w-9 place-items-center rounded-r-lg text-ink-600 transition hover:bg-ink-50"
                      >
                        <Plus size={15} />
                      </button>
                    </div>

                    <span className="font-display text-lg font-bold">
                      {formatMoney(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>

          <Link
            to="/menu"
            className="inline-block pt-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            ← Add more items
          </Link>
        </ul>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <OrderSummary items={items} totals={totals}>
            <button onClick={() => navigate('/checkout')} className="btn-primary btn-lg w-full">
              Continue to address <ArrowRight size={18} />
            </button>
            <p className="mt-3 text-center text-xs text-ink-400">
              No account required. Payment on the next step.
            </p>
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}
