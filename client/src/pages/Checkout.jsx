import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import OrderSummary from '../components/OrderSummary';
import CheckoutSteps from '../components/CheckoutSteps';

// Mirrors the server's validation. The server still re-checks everything — this
// only exists so the customer sees the problem before a round trip.
function validate(values) {
  const errors = {};

  if (!values.name.trim()) errors.name = 'We need a name for the delivery.';
  else if (values.name.trim().length < 2) errors.name = 'That name looks too short.';

  if (!values.phone.trim()) errors.phone = 'The driver will call this number.';
  else if (!/^[\d\s+()-]{7,20}$/.test(values.phone.trim())) errors.phone = 'That is not a valid phone number.';

  if (values.email.trim() && !/^\S+@\S+\.\S+$/.test(values.email.trim())) {
    errors.email = 'That email address looks wrong.';
  }

  if (!values.line1.trim()) errors.line1 = 'Street address is required.';
  if (!values.city.trim()) errors.city = 'City is required.';

  if (!values.postalCode.trim()) errors.postalCode = 'Postal code is required.';
  else if (!/^\d{4,10}$/.test(values.postalCode.trim())) errors.postalCode = 'Enter digits only.';

  return errors;
}

export default function Checkout() {
  const { items, totals, checkout, setCheckout } = useCart();
  const navigate = useNavigate();

  const [values, setValues] = useState(checkout);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Someone deep-linking to /checkout with nothing to buy goes back to the cart.
  if (items.length === 0) return <Navigate to="/cart" replace />;

  const update = (field) => (e) => {
    const value = e.target.value;
    setValues((v) => ({ ...v, [field]: value }));

    // Once a field has been flagged, re-validate as they type so the error clears.
    if (touched[field]) {
      setErrors(validate({ ...values, [field]: value }));
    }
  };

  const blur = (field) => () => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validate(values));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    setTouched(Object.fromEntries(Object.keys(values).map((k) => [k, true])));

    if (Object.keys(found).length > 0) {
      document.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    setCheckout(values);
    navigate('/payment');
  };

  const fieldProps = (field) => ({
    id: field,
    value: values[field],
    onChange: update(field),
    onBlur: blur(field),
    'aria-invalid': Boolean(touched[field] && errors[field]),
    'aria-describedby': touched[field] && errors[field] ? `${field}-error` : undefined,
    className: `input ${touched[field] && errors[field] ? 'input-error' : ''}`,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <CheckoutSteps current={1} />

      <h1 className="font-display text-3xl font-extrabold">Where should we deliver?</h1>
      <p className="mt-1.5 text-sm text-ink-600">
        No account needed — we only use this to get your food to the right door.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <User size={18} className="text-brand-600" /> Contact
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required error={touched.name && errors.name} id="name">
                <input {...fieldProps('name')} type="text" autoComplete="name" placeholder="Camille Laurent" />
              </Field>

              <Field label="Phone number" required error={touched.phone && errors.phone} id="phone">
                <input {...fieldProps('phone')} type="tel" autoComplete="tel" placeholder="+33 6 12 34 56 78" />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Email" hint="optional — for the receipt" error={touched.email && errors.email} id="email">
                  <input {...fieldProps('email')} type="email" autoComplete="email" placeholder="you@example.com" />
                </Field>
              </div>
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <MapPin size={18} className="text-brand-600" /> Delivery address
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Street address" required error={touched.line1 && errors.line1} id="line1">
                  <input {...fieldProps('line1')} type="text" autoComplete="address-line1" placeholder="14 Rue Oberkampf" />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Apartment, floor, etc." hint="optional" id="line2">
                  <input {...fieldProps('line2')} type="text" autoComplete="address-line2" placeholder="Bâtiment B, 3e étage" />
                </Field>
              </div>

              <Field label="City" required error={touched.city && errors.city} id="city">
                <input {...fieldProps('city')} type="text" autoComplete="address-level2" placeholder="Paris" />
              </Field>

              <Field label="Postal code" required error={touched.postalCode && errors.postalCode} id="postalCode">
                <input {...fieldProps('postalCode')} type="text" inputMode="numeric" autoComplete="postal-code" placeholder="75011" />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Landmark" hint="optional — helps the driver" id="landmark">
                  <input {...fieldProps('landmark')} type="text" placeholder="Opposite the green pharmacy sign" />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Notes for the kitchen or driver" hint="optional" id="deliveryNotes">
                  <textarea
                    {...fieldProps('deliveryNotes')}
                    rows={3}
                    maxLength={300}
                    placeholder="Ring twice. Steak saignant, please."
                    className="input resize-none"
                  />
                </Field>
              </div>
            </div>
          </section>

          <button type="submit" className="btn-primary btn-lg w-full lg:hidden">
            Continue to payment <ArrowRight size={18} />
          </button>
        </form>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <OrderSummary items={items} totals={totals}>
            <button onClick={handleSubmit} className="btn-primary btn-lg hidden w-full lg:inline-flex">
              Continue to payment <ArrowRight size={18} />
            </button>
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}

function Field({ label, id, hint, required, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {required && <span className="ml-0.5 text-brand-600">*</span>}
        {hint && <span className="ml-1.5 font-normal text-ink-400">({hint})</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
