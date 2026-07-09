import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageSearch, Search } from 'lucide-react';

export default function TrackLookup() {
  const [value, setValue] = useState('');
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    const orderNumber = value.trim().toUpperCase();
    if (orderNumber) navigate(`/order/${orderNumber}`);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <PackageSearch size={30} />
      </span>

      <h1 className="mt-6 font-display text-3xl font-extrabold">Track your order</h1>
      <p className="mt-2 text-ink-600">
        Enter the order number from your confirmation. It looks like{' '}
        <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-sm">BL-7K3M9P</code>.
      </p>

      <form onSubmit={submit} className="mt-8">
        <label htmlFor="orderNumber" className="sr-only">Order number</label>
        <div className="relative">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            id="orderNumber"
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            placeholder="BL-XXXXXX"
            autoComplete="off"
            className="input pl-10 text-center font-mono text-lg tracking-widest uppercase"
          />
        </div>

        <button type="submit" disabled={!value.trim()} className="btn-primary btn-lg mt-4 w-full">
          Find my order
        </button>
      </form>
    </div>
  );
}
