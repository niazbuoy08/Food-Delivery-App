import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Phone,
  Search,
  StickyNote,
} from 'lucide-react';
import api, { errorMessage } from '../lib/api';
import { formatMoney, timeAgo } from '../lib/format';
import { ALLOWED_TRANSITIONS, ORDER_STATUS, STATUS_META } from '../lib/orderStatus';
import CancelOrderDialog from './CancelOrderDialog';

const FILTERS = [
  { value: '', label: 'All' },
  { value: ORDER_STATUS.PLACED, label: 'New' },
  { value: ORDER_STATUS.CONFIRMED, label: 'Confirmed' },
  { value: ORDER_STATUS.PREPARING, label: 'Preparing' },
  { value: ORDER_STATUS.OUT_FOR_DELIVERY, label: 'Out for delivery' },
  { value: ORDER_STATUS.DELIVERED, label: 'Delivered' },
  { value: ORDER_STATUS.CANCELLED, label: 'Cancelled' },
];

// What the button says for each transition, from the kitchen's point of view.
const ACTION_LABEL = {
  CONFIRMED: 'Accept order',
  PREPARING: 'Start preparing',
  OUT_FOR_DELIVERY: 'Send for delivery',
  DELIVERED: 'Mark delivered',
  CANCELLED: 'Cancel',
};

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || '';
  const page = Number(searchParams.get('page')) || 1;

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      try {
        const { data } = await api.get('/admin/orders', {
          params: { status: status || undefined, page, search: search.trim() || undefined },
        });
        setOrders(data.orders);
        setPagination(data.pagination);
      } catch (err) {
        if (!silent) toast.error(errorMessage(err, 'Could not load orders.'));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [status, page, search]
  );

  // Debounce the search box so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const id = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(id);
  }, [load, search]);

  // Poll so a new order appears without the staff refreshing.
  useEffect(() => {
    const id = setInterval(() => load({ silent: true }), 20000);
    return () => clearInterval(id);
  }, [load]);

  const setFilter = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('status', value);
    else next.delete('status');
    next.delete('page'); // A new filter starts on page 1.
    setSearchParams(next);
  };

  const goToPage = (next) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(next));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const changeStatus = async (order, nextStatus, cancelReason = '') => {
    setUpdatingId(order._id);
    try {
      const { data } = await api.patch(`/admin/orders/${order._id}/status`, {
        status: nextStatus,
        cancelReason,
      });

      // Patch just this row rather than refetching the page.
      setOrders((prev) => prev.map((o) => (o._id === order._id ? data.order : o)));
      toast.success(`${order.orderNumber} → ${STATUS_META[nextStatus].label.toLowerCase()}`);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update that order.'));
      load({ silent: true }); // Our view of this order was stale; resync.
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold">Orders</h1>
        <p className="mt-1 text-sm text-ink-600">
          {pagination.total} {pagination.total === 1 ? 'order' : 'orders'} · this list refreshes every 20 seconds.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number, name or phone…"
            className="input pl-10"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((filter) => (
          <button
            key={filter.value || 'all'}
            onClick={() => setFilter(filter.value)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              status === filter.value
                ? 'bg-ink-900 text-white'
                : 'bg-white text-ink-600 ring-1 ring-ink-100 hover:ring-ink-400/40'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid place-items-center py-24">
          <Loader2 size={26} className="animate-spin text-brand-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="font-display text-lg font-bold">No orders here</p>
          <p className="mt-1.5 text-sm text-ink-600">
            {search || status ? 'Try a different filter or search.' : 'New orders will appear here automatically.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => {
            const meta = STATUS_META[order.status];
            const nextStatuses = ALLOWED_TRANSITIONS[order.status] || [];
            const isExpanded = expandedId === order._id;
            const isUpdating = updatingId === order._id;

            return (
              <li key={order._id} className="card overflow-hidden">
                <div className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : order._id)}
                    aria-expanded={isExpanded}
                    className="flex min-w-0 flex-1 items-center gap-4 text-left"
                  >
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-ink-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display font-bold">{order.orderNumber}</span>
                        <span className={`chip ${meta.chip}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                        {order.payment.method === 'COD' && (
                          <span className="chip bg-ink-100 text-ink-600">Cash on delivery</span>
                        )}
                      </div>

                      <p className="mt-1 truncate text-sm text-ink-600">
                        {order.customer.name} · {order.items.length}{' '}
                        {order.items.length === 1 ? 'item' : 'items'} · {timeAgo(order.createdAt)}
                      </p>
                    </div>

                    <span className="shrink-0 font-display text-lg font-bold">
                      {formatMoney(order.total)}
                    </span>
                  </button>

                  {nextStatuses.length > 0 && (
                    <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                      {nextStatuses
                        .filter((s) => s !== ORDER_STATUS.CANCELLED)
                        .map((next) => (
                          <button
                            key={next}
                            disabled={isUpdating}
                            onClick={() => changeStatus(order, next)}
                            className="btn-primary btn-sm flex-1 sm:flex-none"
                          >
                            {isUpdating ? <Loader2 size={14} className="animate-spin" /> : null}
                            {ACTION_LABEL[next]}
                          </button>
                        ))}

                      {nextStatuses.includes(ORDER_STATUS.CANCELLED) && (
                        <button
                          disabled={isUpdating}
                          onClick={() => setCancelTarget(order)}
                          className="btn btn-sm border border-ink-100 text-ink-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden border-t border-ink-100 bg-ink-50/60"
                    >
                      <div className="grid gap-6 p-5 sm:grid-cols-3">
                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                            Items
                          </h3>
                          <ul className="mt-2.5 space-y-1.5 text-sm">
                            {order.items.map((item) => (
                              <li key={item.name} className="flex justify-between gap-3">
                                <span className="text-ink-600">
                                  <span className="font-medium text-ink-900">{item.quantity}×</span>{' '}
                                  {item.name}
                                </span>
                                <span>{formatMoney(item.price * item.quantity)}</span>
                              </li>
                            ))}
                          </ul>

                          <div className="mt-3 border-t border-ink-100 pt-2 text-sm">
                            <div className="flex justify-between text-ink-400">
                              <span>Subtotal + fees + tax</span>
                            </div>
                            <div className="mt-1 flex justify-between font-display font-bold">
                              <span>Total</span>
                              <span>{formatMoney(order.total)}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                            Deliver to
                          </h3>
                          <p className="mt-2.5 text-sm leading-relaxed text-ink-600">
                            <span className="font-medium text-ink-900">{order.customer.name}</span>
                            <br />
                            {order.address.line1}
                            {order.address.line2 && <>, {order.address.line2}</>}
                            <br />
                            {order.address.city} {order.address.postalCode}
                          </p>

                          {order.address.landmark && (
                            <p className="mt-2 flex items-start gap-1.5 text-xs text-ink-400">
                              <MapPin size={13} className="mt-0.5 shrink-0" />
                              {order.address.landmark}
                            </p>
                          )}

                          <a
                            href={`tel:${order.customer.phone}`}
                            className="mt-2 flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
                          >
                            <Phone size={13} /> {order.customer.phone}
                          </a>
                        </div>

                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                            Payment & notes
                          </h3>
                          <p className="mt-2.5 text-sm text-ink-600">
                            {order.payment.method === 'COD'
                              ? 'Cash on delivery'
                              : `Card ending ${order.payment.cardLast4}`}
                            {' · '}
                            <span
                              className={
                                order.payment.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'
                              }
                            >
                              {order.payment.status.toLowerCase()}
                            </span>
                          </p>

                          {order.deliveryNotes ? (
                            <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-50 p-2.5 text-xs leading-relaxed text-amber-900">
                              <StickyNote size={13} className="mt-0.5 shrink-0" />
                              {order.deliveryNotes}
                            </p>
                          ) : (
                            <p className="mt-3 text-xs text-ink-400">No special instructions.</p>
                          )}

                          {order.cancelReason && (
                            <p className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-800">
                              Cancelled: {order.cancelReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
            className="btn-secondary btn-sm"
          >
            <ChevronLeft size={15} /> Previous
          </button>
          <span className="px-3 text-sm text-ink-600">
            Page {page} of {pagination.pages}
          </span>
          <button
            disabled={page >= pagination.pages}
            onClick={() => goToPage(page + 1)}
            className="btn-secondary btn-sm"
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      )}

      <CancelOrderDialog
        order={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={(reason) => {
          changeStatus(cancelTarget, ORDER_STATUS.CANCELLED, reason);
          setCancelTarget(null);
        }}
      />
    </div>
  );
}
