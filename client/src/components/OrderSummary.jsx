import { formatMoney } from '../lib/format';
import { FREE_DELIVERY_THRESHOLD } from '../context/CartContext';

export default function OrderSummary({ items, totals, children }) {
  return (
    <div className="card p-5 sm:p-6">
      <h2 className="font-display text-lg font-bold">Order summary</h2>

      <ul className="mt-4 space-y-3 border-b border-ink-100 pb-4">
        {items.map((item) => (
          <li key={item._id} className="flex items-start justify-between gap-3 text-sm">
            <span className="text-ink-600">
              <span className="font-medium text-ink-900">{item.quantity}×</span> {item.name}
            </span>
            <span className="shrink-0 font-medium">{formatMoney(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-2.5 text-sm">
        <Row label="Subtotal" value={formatMoney(totals.subtotal)} />
        <Row
          label="Delivery"
          value={
            totals.deliveryFee === 0 ? (
              <span className="font-semibold text-emerald-600">Free</span>
            ) : (
              formatMoney(totals.deliveryFee)
            )
          }
        />
        <Row label="TVA (10%)" value={formatMoney(totals.tax)} />

        <div className="flex items-baseline justify-between border-t border-ink-100 pt-3">
          <dt className="font-display text-base font-bold">Total</dt>
          <dd className="font-display text-xl font-extrabold text-brand-700">
            {formatMoney(totals.total)}
          </dd>
        </div>
      </dl>

      {totals.amountToFreeDelivery > 0 && (
        <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
          Add {formatMoney(totals.amountToFreeDelivery)} more for free delivery
          {' '}(orders over {formatMoney(FREE_DELIVERY_THRESHOLD)}).
        </p>
      )}

      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-ink-600">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
