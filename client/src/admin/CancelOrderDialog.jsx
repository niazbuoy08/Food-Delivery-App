import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const REASONS = [
  'Kitchen is at capacity',
  'An item is out of stock',
  'Address is outside our delivery area',
  'Customer requested cancellation',
];

/**
 * Cancelling is irreversible and refunds the customer, so it asks for a reason
 * rather than firing on a single click.
 */
export default function CancelOrderDialog({ order, onClose, onConfirm }) {
  const dialogRef = useRef(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (order) {
      setReason('');
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [order]);

  if (!order) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      className="w-[min(28rem,calc(100vw-2rem))] rounded-2xl p-0 backdrop:bg-ink-900/40 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-red-50 text-red-600">
          <AlertTriangle size={20} />
        </span>

        <h2 className="mt-4 font-display text-lg font-bold">Cancel {order.orderNumber}?</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
          {order.customer.name} will see this on their tracking page.
          {order.payment.status === 'PAID' && ' Their card payment will be refunded.'}
          {' '}This cannot be undone.
        </p>

        <fieldset className="mt-5">
          <legend className="label">Reason</legend>
          <div className="space-y-2">
            {REASONS.map((option) => (
              <label
                key={option}
                className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition ${
                  reason === option ? 'border-brand-500 bg-brand-50/60' : 'border-ink-100 hover:border-ink-400/40'
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={option}
                  checked={reason === option}
                  onChange={(e) => setReason(e.target.value)}
                  className="accent-brand-600"
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="btn-secondary btn-md flex-1">
            Keep order
          </button>
          <button
            disabled={!reason}
            onClick={() => onConfirm(reason)}
            className="btn btn-md flex-1 bg-red-600 text-white hover:bg-red-700 disabled:opacity-40"
          >
            Cancel order
          </button>
        </div>
      </div>
    </dialog>
  );
}
