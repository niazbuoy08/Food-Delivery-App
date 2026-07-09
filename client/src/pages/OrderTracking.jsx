import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Check,
  ChefHat,
  CircleCheck,
  Loader2,
  MapPin,
  Phone,
  Receipt,
  Truck,
  Utensils,
  XCircle,
} from 'lucide-react';
import api, { errorMessage } from '../lib/api';
import { formatDateTime, formatMoney } from '../lib/format';
import { ORDER_STATUS, STATUS_META, TRACKING_STEPS } from '../lib/orderStatus';
import CheckoutSteps from '../components/CheckoutSteps';

const STEP_ICONS = {
  PLACED: Receipt,
  CONFIRMED: CircleCheck,
  PREPARING: ChefHat,
  OUT_FOR_DELIVERY: Truck,
  DELIVERED: Utensils,
};

const POLL_INTERVAL_MS = 15000;

export default function OrderTracking() {
  const { orderNumber } = useParams();
  const { state } = useLocation();
  const justPlaced = state?.justPlaced;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const timerRef = useRef(null);

  const fetchOrder = useCallback(
    async ({ silent = false } = {}) => {
      try {
        const { data } = await api.get(`/orders/${orderNumber}`);
        setOrder(data.order);
        setError('');
        return data.order;
      } catch (err) {
        // A background refresh that fails shouldn't wipe an order already on screen.
        if (!silent) setError(errorMessage(err, 'We could not find that order.'));
        return null;
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [orderNumber]
  );

  useEffect(() => {
    let cancelled = false;

    // Poll until the order reaches a state that can't change, then stop.
    const tick = async () => {
      const fresh = await fetchOrder({ silent: true });
      if (cancelled) return;

      const isFinal =
        fresh?.status === ORDER_STATUS.DELIVERED || fresh?.status === ORDER_STATUS.CANCELLED;
      if (!isFinal) timerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
    };

    fetchOrder().then((first) => {
      if (cancelled || !first) return;
      const isFinal =
        first.status === ORDER_STATUS.DELIVERED || first.status === ORDER_STATUS.CANCELLED;
      if (!isFinal) timerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
    });

    return () => {
      cancelled = true;
      clearTimeout(timerRef.current);
    };
  }, [fetchOrder]);

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="text-center">
          <Loader2 size={28} className="mx-auto animate-spin text-brand-600" />
          <p className="mt-3 text-sm text-ink-400">Finding your order…</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <XCircle size={40} className="mx-auto text-ink-400" />
        <h1 className="mt-5 font-display text-2xl font-extrabold">Order not found</h1>
        <p className="mt-2 text-ink-600">{error}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/track" className="btn-secondary btn-md">Try another number</Link>
          <Link to="/menu" className="btn-primary btn-md">Browse menu</Link>
        </div>
      </div>
    );
  }

  const isCancelled = order.status === ORDER_STATUS.CANCELLED;
  const currentStep = TRACKING_STEPS.indexOf(order.status);
  const meta = STATUS_META[order.status];

  // The timeline records when each status was reached; use it to timestamp steps.
  const reachedAt = Object.fromEntries(order.statusHistory.map((h) => [h.status, h.at]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {justPlaced && <CheckoutSteps current={3} />}

      {justPlaced && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 rounded-2xl bg-emerald-50 p-6 text-center ring-1 ring-emerald-200"
        >
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-600 text-white">
            <Check size={26} strokeWidth={3} />
          </span>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-emerald-900">
            Thank you, {order.customer.name.split(' ')[0]}!
          </h1>
          <p className="mt-1.5 text-sm text-emerald-800">
            Your order is with the kitchen. Bookmark this page — it updates on its own.
          </p>
        </motion.div>
      )}

      <div className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Order number</p>
            <p className="font-display text-2xl font-extrabold tracking-tight">{order.orderNumber}</p>
            <p className="mt-1 text-sm text-ink-400">Placed {formatDateTime(order.createdAt)}</p>
          </div>

          <span className={`chip ${meta.chip} px-3 py-1.5 text-sm`}>
            <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
        </div>

        <p className="mt-4 rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-600">
          {meta.customerCopy}
          {!isCancelled && order.status !== ORDER_STATUS.DELIVERED && (
            <> Estimated arrival in about <strong className="text-ink-900">{order.estimatedMins} minutes</strong>.</>
          )}
        </p>

        {isCancelled ? (
          <div className="mt-6 rounded-xl bg-red-50 p-5 text-center ring-1 ring-red-100">
            <XCircle size={24} className="mx-auto text-red-500" />
            <p className="mt-2 font-display font-bold text-red-900">This order was cancelled</p>
            {order.cancelReason && <p className="mt-1 text-sm text-red-700">{order.cancelReason}</p>}
            <p className="mt-2 text-xs text-red-600">
              Any payment will be refunded to the original method within 5 business days.
            </p>
          </div>
        ) : (
          <ol className="mt-8">
            {TRACKING_STEPS.map((step, i) => {
              const Icon = STEP_ICONS[step];
              const isDone = i < currentStep;
              const isCurrent = i === currentStep;
              const isLast = i === TRACKING_STEPS.length - 1;

              return (
                <li key={step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                            ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                            : 'bg-ink-100 text-ink-400'
                      }`}
                    >
                      {isDone ? <Check size={17} strokeWidth={3} /> : <Icon size={17} />}
                    </span>

                    {!isLast && (
                      <span
                        className={`w-0.5 flex-1 ${isDone ? 'bg-emerald-600' : 'bg-ink-100'}`}
                        style={{ minHeight: '2.25rem' }}
                      />
                    )}
                  </div>

                  <div className={`pb-8 ${isLast ? 'pb-0' : ''}`}>
                    <p
                      className={`font-display text-sm font-bold ${
                        isDone || isCurrent ? 'text-ink-900' : 'text-ink-400'
                      }`}
                    >
                      {STATUS_META[step].label}
                      {isCurrent && (
                        <span className="ml-2 inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500 align-middle" />
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-400">
                      {reachedAt[step] ? formatDateTime(reachedAt[step]) : 'Pending'}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-display text-base font-bold">
            <MapPin size={16} className="text-brand-600" /> Delivering to
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-600">
            <span className="font-medium text-ink-900">{order.customer.name}</span>
            <br />
            {order.address.line1}
            {order.address.line2 && <>, {order.address.line2}</>}
            <br />
            {order.address.city} {order.address.postalCode}
            {order.address.landmark && (
              <>
                <br />
                <span className="text-ink-400">Near {order.address.landmark}</span>
              </>
            )}
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-600">
            <Phone size={14} /> {order.customer.phone}
          </p>
        </section>

        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-display text-base font-bold">
            <Receipt size={16} className="text-brand-600" /> Your order
          </h2>

          <ul className="mt-3 space-y-2 border-b border-ink-100 pb-3 text-sm">
            {order.items.map((item) => (
              <li key={item.name} className="flex justify-between gap-3">
                <span className="text-ink-600">
                  <span className="font-medium text-ink-900">{item.quantity}×</span> {item.name}
                </span>
                <span className="shrink-0">{formatMoney(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-ink-600">
              <dt>Subtotal</dt>
              <dd>{formatMoney(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-ink-600">
              <dt>Delivery</dt>
              <dd>{order.deliveryFee === 0 ? 'Free' : formatMoney(order.deliveryFee)}</dd>
            </div>
            <div className="flex justify-between text-ink-600">
              <dt>TVA</dt>
              <dd>{formatMoney(order.tax)}</dd>
            </div>
            <div className="flex justify-between border-t border-ink-100 pt-2 font-display font-bold">
              <dt>Total</dt>
              <dd className="text-brand-700">{formatMoney(order.total)}</dd>
            </div>
          </dl>

          <p className="mt-3 text-xs text-ink-400">
            {order.payment.method === 'COD'
              ? 'Paying cash on delivery'
              : `Paid by card ending ${order.payment.cardLast4}`}
          </p>
        </section>
      </div>

      <p className="mt-8 text-center text-sm text-ink-400">
        This page refreshes automatically.{' '}
        <Link to="/menu" className="font-semibold text-brand-700 hover:text-brand-800">
          Order something else
        </Link>
      </p>
    </div>
  );
}
