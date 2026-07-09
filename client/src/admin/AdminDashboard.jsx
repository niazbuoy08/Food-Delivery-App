import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BellRing, Euro, Loader2, ShoppingBag, TrendingUp } from 'lucide-react';
import api, { errorMessage } from '../lib/api';
import { formatMoney } from '../lib/format';
import { STATUS_META, TRACKING_STEPS } from '../lib/orderStatus';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = () =>
      api
        .get('/admin/stats')
        .then(({ data }) => !cancelled && setStats(data.stats))
        .catch((err) => !cancelled && setError(errorMessage(err)));

    load();
    // Keep the tiles fresh while the kitchen leaves this open on a screen.
    const id = setInterval(load, 30000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (error) {
    return <p className="card p-8 text-center text-sm text-red-600">{error}</p>;
  }

  if (!stats) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 size={26} className="animate-spin text-brand-600" />
      </div>
    );
  }

  const tiles = [
    { label: "Today's revenue", value: formatMoney(stats.todayRevenue), icon: Euro, accent: 'text-emerald-600 bg-emerald-50' },
    { label: "Today's orders", value: stats.todayOrders, icon: ShoppingBag, accent: 'text-blue-600 bg-blue-50' },
    { label: 'Active right now', value: stats.activeOrders, icon: TrendingUp, accent: 'text-violet-600 bg-violet-50' },
    { label: 'Awaiting confirmation', value: stats.newOrders, icon: BellRing, accent: 'text-brand-600 bg-brand-50' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-600">How the restaurant is doing today.</p>
        </div>

        {stats.newOrders > 0 && (
          <Link to="/admin/orders?status=PLACED" className="btn-primary btn-md">
            <BellRing size={16} />
            {stats.newOrders} new {stats.newOrders === 1 ? 'order needs' : 'orders need'} confirming
          </Link>
        )}
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="card p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm text-ink-600">{label}</p>
              <span className={`grid h-9 w-9 place-items-center rounded-lg ${accent}`}>
                <Icon size={17} />
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-extrabold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="font-display text-lg font-bold">Orders by stage</h2>
          <p className="mt-1 text-sm text-ink-400">Everything the kitchen has ever handled.</p>

          <ul className="mt-5 space-y-3">
            {TRACKING_STEPS.map((status) => {
              const count = stats.byStatus[status] || 0;
              const total = Object.values(stats.byStatus).reduce((a, b) => a + b, 0) || 1;

              return (
                <li key={status}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${STATUS_META[status].dot}`} />
                      {STATUS_META[status].label}
                    </span>
                    <span className="font-display font-bold tabular-nums">{count}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className={`h-full rounded-full ${STATUS_META[status].dot} transition-all duration-700`}
                      style={{ width: `${(count / total) * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="card p-6">
          <h2 className="font-display text-lg font-bold">Best sellers</h2>
          <p className="mt-1 text-sm text-ink-400">By total quantity ordered.</p>

          {stats.topItems.length === 0 ? (
            <p className="mt-8 text-center text-sm text-ink-400">No orders yet.</p>
          ) : (
            <ol className="mt-5 space-y-3">
              {stats.topItems.map((item, i) => (
                <li key={item.name} className="flex items-center gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ink-100 font-display text-xs font-bold text-ink-600">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-sm font-medium">{item.name}</span>
                  <span className="shrink-0 text-sm text-ink-400">{item.qty} sold</span>
                </li>
              ))}
            </ol>
          )}

          <Link
            to="/admin/orders"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            See all orders <ArrowRight size={14} />
          </Link>
        </section>
      </div>
    </div>
  );
}
