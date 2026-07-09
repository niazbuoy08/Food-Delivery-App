import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Leaf, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import api, { errorMessage } from '../lib/api';
import { formatMoney } from '../lib/format';
import MenuItemForm from './MenuItemForm';

export default function AdminMenu() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allergens, setAllergens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/menu');
      setItems(data.items);
      setCategories(data.categories);
      setAllergens(data.allergens || []);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not load the menu.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Returns whether the save succeeded, so the form knows to stay open on failure.
  const save = async (values) => {
    try {
      if (editing) {
        const { data } = await api.patch(`/admin/menu/${editing._id}`, values);
        setItems((prev) => prev.map((i) => (i._id === editing._id ? data.item : i)));
        toast.success(`Saved "${data.item.name}"`);
      } else {
        const { data } = await api.post('/admin/menu', values);
        setItems((prev) => [...prev, data.item]);
        toast.success(`Added "${data.item.name}" to the menu`);
      }
      closeForm();
      return true;
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save that dish.'));
      return false;
    }
  };

  const toggleAvailable = async (item) => {
    setTogglingId(item._id);
    try {
      const { data } = await api.patch(`/admin/menu/${item._id}`, { isAvailable: !item.isAvailable });
      setItems((prev) => prev.map((i) => (i._id === item._id ? data.item : i)));
      toast.success(data.item.isAvailable ? `"${item.name}" is back on` : `"${item.name}" hidden from customers`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setTogglingId(null);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Permanently delete "${item.name}"? Past orders will still show it.`)) return;

    try {
      await api.delete(`/admin/menu/${item._id}`);
      setItems((prev) => prev.filter((i) => i._id !== item._id));
      toast.success(`Deleted "${item.name}"`);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete that dish.'));
    }
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const grouped = categories
    .map((category) => ({ category, items: items.filter((i) => i.category === category) }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Menu</h1>
          <p className="mt-1 text-sm text-ink-600">
            {items.length} dishes · {items.filter((i) => !i.isAvailable).length} hidden from customers
          </p>
        </div>

        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="btn-primary btn-md"
        >
          <Plus size={16} /> Add a dish
        </button>
      </header>

      {loading ? (
        <div className="grid place-items-center py-24">
          <Loader2 size={26} className="animate-spin text-brand-600" />
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ category, items: group }) => (
            <section key={category}>
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink-400">
                {category}
              </h2>

              <ul className="mt-3 space-y-2">
                {group.map((item) => (
                  <li
                    key={item._id}
                    className={`card flex items-center gap-4 p-3 transition ${
                      item.isAvailable ? '' : 'opacity-60'
                    }`}
                  >
                    <img src={item.image} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.isVeg && <Leaf size={14} className="shrink-0 text-green-600" />}
                        <span className="font-display font-bold">{item.name}</span>
                        {item.isPopular && <span className="chip bg-brand-50 text-brand-700">Signature</span>}
                        {!item.isAvailable && <span className="chip bg-ink-100 text-ink-600">Hidden</span>}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-ink-400">{item.description}</p>
                      {item.allergens?.length > 0 && (
                        <p className="mt-0.5 truncate text-[11px] text-ink-400">
                          Allergens: {item.allergens.join(' · ')}
                        </p>
                      )}
                    </div>

                    <span className="shrink-0 font-display font-bold">{formatMoney(item.price)}</span>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => toggleAvailable(item)}
                        disabled={togglingId === item._id}
                        role="switch"
                        aria-checked={item.isAvailable}
                        aria-label={`${item.name} available to order`}
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                          item.isAvailable ? 'bg-emerald-500' : 'bg-ink-100'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                            item.isAvailable ? 'translate-x-[1.375rem]' : 'translate-x-0.5'
                          }`}
                        />
                      </button>

                      <button
                        onClick={() => {
                          setEditing(item);
                          setFormOpen(true);
                        }}
                        aria-label={`Edit ${item.name}`}
                        className="rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-900"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => remove(item)}
                        aria-label={`Delete ${item.name}`}
                        className="rounded-lg p-2 text-ink-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <MenuItemForm
        open={formOpen}
        item={editing}
        categories={categories}
        allergens={allergens}
        onClose={closeForm}
        onSave={save}
      />
    </div>
  );
}
