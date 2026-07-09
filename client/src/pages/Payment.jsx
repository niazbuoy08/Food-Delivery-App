import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Banknote, CreditCard, Loader2, Lock, ShieldCheck } from 'lucide-react';
import api, { errorMessage } from '../lib/api';
import { useCart } from '../context/CartContext';
import { formatMoney } from '../lib/format';
import OrderSummary from '../components/OrderSummary';
import CheckoutSteps from '../components/CheckoutSteps';

const formatCardNumber = (value) =>
  value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

const formatExpiry = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

export default function Payment() {
  const { items, totals, checkout, clearCart } = useCart();
  const navigate = useNavigate();

  const [method, setMethod] = useState('CARD');
  const [card, setCard] = useState({ nameOnCard: '', cardNumber: '', expiry: '', cvv: '' });
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) return <Navigate to="/cart" replace />;
  // Reached /payment without filling in an address — send them back a step.
  if (!checkout.name || !checkout.line1) return <Navigate to="/checkout" replace />;

  const placeOrder = async (e) => {
    e.preventDefault();
    if (submitting) return; // Guards against a double-click charging twice.

    setSubmitting(true);
    const toastId = toast.loading(method === 'CARD' ? 'Processing payment…' : 'Placing your order…');

    try {
      const { data } = await api.post('/orders', {
        customer: { name: checkout.name, phone: checkout.phone, email: checkout.email },
        address: {
          line1: checkout.line1,
          line2: checkout.line2,
          city: checkout.city,
          postalCode: checkout.postalCode,
          landmark: checkout.landmark,
        },
        // Only ids and quantities. The server prices the cart from the database.
        items: items.map((i) => ({ menuItem: i._id, quantity: i.quantity })),
        deliveryNotes: checkout.deliveryNotes,
        payment: method === 'CARD' ? { method, ...card } : { method: 'COD' },
      });

      toast.success('Order placed!', { id: toastId });
      clearCart();
      navigate(`/order/${data.order.orderNumber}`, { state: { justPlaced: true }, replace: true });
    } catch (err) {
      toast.error(errorMessage(err, 'We could not place your order.'), { id: toastId, duration: 6000 });
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <CheckoutSteps current={2} />

      <h1 className="font-display text-3xl font-extrabold">Payment</h1>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-600">
        <Lock size={14} /> This is a demo checkout — no real card is ever charged.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <form onSubmit={placeOrder} className="space-y-6">
          <fieldset className="card p-5 sm:p-6">
            <legend className="sr-only">Payment method</legend>
            <h2 className="font-display text-lg font-bold">How would you like to pay?</h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MethodOption
                icon={CreditCard}
                title="Card"
                subtitle="Pay now, in a few seconds"
                selected={method === 'CARD'}
                onSelect={() => setMethod('CARD')}
              />
              <MethodOption
                icon={Banknote}
                title="Cash on delivery"
                subtitle={`Pay ${formatMoney(totals.total)} at the door`}
                selected={method === 'COD'}
                onSelect={() => setMethod('COD')}
              />
            </div>
          </fieldset>

          {method === 'CARD' && (
            <section className="card animate-fade-up p-5 sm:p-6">
              <h2 className="font-display text-lg font-bold">Card details</h2>

              <div className="mt-5 space-y-4">
                <div>
                  <label htmlFor="nameOnCard" className="label">Name on card</label>
                  <input
                    id="nameOnCard"
                    required
                    autoComplete="cc-name"
                    value={card.nameOnCard}
                    onChange={(e) => setCard({ ...card, nameOnCard: e.target.value })}
                    placeholder="CAMILLE LAURENT"
                    className="input uppercase placeholder:normal-case"
                  />
                </div>

                <div>
                  <label htmlFor="cardNumber" className="label">Card number</label>
                  <input
                    id="cardNumber"
                    required
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={card.cardNumber}
                    onChange={(e) => setCard({ ...card, cardNumber: formatCardNumber(e.target.value) })}
                    placeholder="4242 4242 4242 4242"
                    className="input font-mono tracking-wider"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="expiry" className="label">Expiry</label>
                    <input
                      id="expiry"
                      required
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      value={card.expiry}
                      onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                      placeholder="12/28"
                      className="input font-mono"
                    />
                  </div>
                  <div>
                    <label htmlFor="cvv" className="label">CVV</label>
                    <input
                      id="cvv"
                      required
                      type="password"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      value={card.cvv}
                      onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                      placeholder="123"
                      className="input font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-ink-50 p-3.5 text-xs leading-relaxed text-ink-600">
                <p className="font-semibold text-ink-800">Test cards</p>
                <p className="mt-1">
                  <button
                    type="button"
                    onClick={() => setCard({ ...card, cardNumber: '4242 4242 4242 4242' })}
                    className="font-mono text-brand-700 underline underline-offset-2"
                  >
                    4242 4242 4242 4242
                  </button>{' '}
                  succeeds ·{' '}
                  <button
                    type="button"
                    onClick={() => setCard({ ...card, cardNumber: '4000 0000 0000 0002' })}
                    className="font-mono text-brand-700 underline underline-offset-2"
                  >
                    4000 0000 0000 0002
                  </button>{' '}
                  is declined. Any future expiry and any CVV.
                </p>
              </div>
            </section>
          )}

          <div className="card flex items-start gap-3 bg-emerald-50/60 p-4 ring-1 ring-emerald-100">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            <p className="text-sm leading-relaxed text-emerald-900">
              Your card details are validated in the browser and never stored. This project
              simulates the gateway — swap in Stripe and nothing else changes.
            </p>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary btn-lg w-full lg:hidden">
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
            {submitting ? 'Processing…' : `Place order · ${formatMoney(totals.total)}`}
          </button>
        </form>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <OrderSummary items={items} totals={totals}>
            <div className="mb-4 rounded-xl bg-ink-50 p-3.5 text-xs leading-relaxed">
              <p className="font-semibold text-ink-800">Delivering to</p>
              <p className="mt-1 text-ink-600">
                {checkout.name} · {checkout.phone}
                <br />
                {checkout.line1}
                {checkout.line2 && `, ${checkout.line2}`}
                <br />
                {checkout.city} {checkout.postalCode}
              </p>
            </div>

            <button
              onClick={placeOrder}
              disabled={submitting}
              className="btn-primary btn-lg hidden w-full lg:inline-flex"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
              {submitting ? 'Processing…' : `Place order · ${formatMoney(totals.total)}`}
            </button>
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}

function MethodOption({ icon: Icon, title, subtitle, selected, onSelect }) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition ${
        selected ? 'border-brand-500 bg-brand-50/60' : 'border-ink-100 hover:border-ink-400/40'
      }`}
    >
      <input
        type="radio"
        name="paymentMethod"
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <Icon size={20} className={selected ? 'text-brand-600' : 'text-ink-400'} />
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs text-ink-400">{subtitle}</span>
      </span>
    </label>
  );
}
