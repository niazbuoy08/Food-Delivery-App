import { useEffect, useMemo, useState } from 'react';
import { Leaf, Loader2, Search, SlidersHorizontal, X } from 'lucide-react';
import api, { errorMessage } from '../lib/api';
import { useSlowLoad } from '../lib/useSlowLoad';
import MenuItemCard from '../components/MenuItemCard';

export default function Menu() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isWakingServer = useSlowLoad(loading);

  // Fetch once and filter in the browser. The menu is small, so this keeps
  // category switching and typing instant instead of round-tripping per keystroke.
  useEffect(() => {
    let cancelled = false;

    api
      .get('/menu')
      .then(({ data }) => {
        if (cancelled) return;
        setItems(data.items);
        setCategories(data.categories);
      })
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load the menu.')))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (category !== 'All' && item.category !== category) return false;
      if (vegOnly && !item.isVeg) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
      );
    });
  }, [items, category, search, vegOnly]);

  const tabs = ['All', ...categories];
  const hasFilters = category !== 'All' || vegOnly || search.trim();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">La Carte</h1>
        <p className="mt-2 text-ink-600">
          Everything is cooked after you order. Add what you like — no account needed.
        </p>
      </header>

      <div className="sticky top-16 z-30 -mx-4 mt-6 bg-ink-50/95 px-4 py-4 backdrop-blur sm:top-16 sm:mx-0 sm:rounded-2xl sm:px-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for coq au vin, croissant, tarte…"
              aria-label="Search the menu"
              className="input pl-10"
            />
          </div>

          <button
            onClick={() => setVegOnly((v) => !v)}
            aria-pressed={vegOnly}
            className={`btn btn-md shrink-0 border ${
              vegOnly
                ? 'border-green-600 bg-green-50 text-green-800'
                : 'border-ink-100 bg-white text-ink-600 hover:border-ink-400/40'
            }`}
          >
            <Leaf size={15} />
            Végétarien
          </button>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setCategory(tab)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                category === tab
                  ? 'bg-ink-900 text-white'
                  : 'bg-white text-ink-600 ring-1 ring-ink-100 hover:ring-ink-400/40'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading && isWakingServer && (
        <p className="mt-6 flex items-center gap-2.5 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
          <Loader2 size={15} className="shrink-0 animate-spin" />
          Waking the kitchen up — this demo runs on free hosting that sleeps when
          idle, so the first load can take up to a minute. It's quick after that.
        </p>
      )}

      {loading && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="skeleton aspect-[4/3]" />
              <div className="space-y-3 p-4">
                <div className="skeleton h-4 w-2/3 rounded" />
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-10 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="mt-10 card p-8 text-center">
          <p className="font-display text-lg font-bold">We couldn't load the menu</p>
          <p className="mt-1.5 text-sm text-ink-600">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary btn-md mt-5">
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <p className="mt-6 text-sm text-ink-400">
            {visible.length} {visible.length === 1 ? 'plat' : 'plats'}
            {hasFilters && (
              <button
                onClick={() => {
                  setCategory('All');
                  setSearch('');
                  setVegOnly(false);
                }}
                className="ml-3 inline-flex items-center gap-1 font-medium text-brand-700 hover:text-brand-800"
              >
                <X size={13} /> Clear filters
              </button>
            )}
          </p>

          {visible.length === 0 ? (
            <div className="mt-6 card p-12 text-center">
              <SlidersHorizontal size={28} className="mx-auto text-ink-400" />
              <p className="mt-4 font-display text-lg font-bold">Nothing matches that</p>
              <p className="mt-1.5 text-sm text-ink-600">
                Try a different search, or clear the filters to see the full menu.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((item, i) => (
                <MenuItemCard key={item._id} item={item} index={i} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
