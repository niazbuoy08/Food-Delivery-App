import { useEffect, useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';

const BLANK = {
  name: '',
  description: '',
  price: '',
  category: 'Plats',
  image: '',
  isVeg: false,
  isAvailable: true,
  isPopular: false,
  prepTimeMins: 20,
  allergens: [],
};

/** `item` is null when creating, or the item being edited. */
export default function MenuItemForm({ item, categories, allergens = [], open, onClose, onSave }) {
  const dialogRef = useRef(null);
  const [values, setValues] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      dialogRef.current?.close();
      return;
    }

    // Reset to the target item every time it opens, so a cancelled edit doesn't
    // leak into the next one.
    setValues(item ? { ...BLANK, ...item, price: String(item.price) } : BLANK);
    setSaving(false);
    dialogRef.current?.showModal();
  }, [open, item]);

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setValues((v) => ({ ...v, [field]: value }));
  };

  const toggleAllergen = (allergen) =>
    setValues((v) => ({
      ...v,
      allergens: v.allergens.includes(allergen)
        ? v.allergens.filter((a) => a !== allergen)
        : [...v.allergens, allergen],
    }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const ok = await onSave({
      name: values.name.trim(),
      description: values.description.trim(),
      price: Number(values.price),
      category: values.category,
      image: values.image.trim(),
      isVeg: values.isVeg,
      isAvailable: values.isAvailable,
      isPopular: values.isPopular,
      prepTimeMins: Number(values.prepTimeMins),
      allergens: values.allergens,
    });

    // Leave the dialog open on failure so nothing typed is lost.
    if (!ok) setSaving(false);
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="w-[min(34rem,calc(100vw-2rem))] rounded-2xl p-0 backdrop:bg-ink-900/40 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={submit} className="max-h-[85vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-lg font-bold">
            {item ? `Edit ${item.name}` : 'Add a dish'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100"
          >
            <X size={17} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="mi-name" className="label">Name</label>
            <input id="mi-name" required maxLength={80} value={values.name} onChange={set('name')} className="input" />
          </div>

          <div>
            <label htmlFor="mi-desc" className="label">Description</label>
            <textarea
              id="mi-desc"
              required
              rows={2}
              maxLength={300}
              value={values.description}
              onChange={set('description')}
              className="input resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="mi-price" className="label">Price (€)</label>
              <input
                id="mi-price"
                required
                type="number"
                min="0"
                step="0.10"
                value={values.price}
                onChange={set('price')}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="mi-category" className="label">Category</label>
              <select id="mi-category" value={values.category} onChange={set('category')} className="input">
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            {/* Not type="url" — the seeded dishes use same-origin paths like
                /dishes/croissant.jpg, which a url input would reject. */}
            <label htmlFor="mi-image" className="label">Image</label>
            <input
              id="mi-image"
              required
              type="text"
              value={values.image}
              onChange={set('image')}
              placeholder="/dishes/croissant.jpg  or  https://…"
              className="input"
            />
            {values.image && (
              <img
                src={values.image}
                alt=""
                onError={(e) => (e.currentTarget.style.display = 'none')}
                onLoad={(e) => (e.currentTarget.style.display = 'block')}
                className="mt-2 h-28 w-full rounded-lg object-cover"
              />
            )}
          </div>

          <div>
            <label htmlFor="mi-prep" className="label">Prep time (mins)</label>
            <input
              id="mi-prep"
              type="number"
              min="1"
              max="180"
              value={values.prepTimeMins}
              onChange={set('prepTimeMins')}
              className="input"
            />
          </div>

          <fieldset>
            <legend className="label">
              Allergens
              <span className="ml-1.5 font-normal text-ink-400">
                (shown on the dish card — EU law requires declaring these)
              </span>
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {allergens.map((allergen) => {
                const selected = values.allergens.includes(allergen);
                return (
                  <button
                    key={allergen}
                    type="button"
                    onClick={() => toggleAllergen(allergen)}
                    aria-pressed={selected}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      selected
                        ? 'bg-brand-600 text-ink-50'
                        : 'bg-ink-100 text-ink-600 hover:bg-ink-100/70'
                    }`}
                  >
                    {allergen}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-2 rounded-xl bg-ink-50 p-3.5">
            <Toggle id="mi-veg" label="Vegetarian" checked={values.isVeg} onChange={set('isVeg')} />
            <Toggle
              id="mi-available"
              label="Available to order"
              hint="Turn off to hide from customers without deleting it"
              checked={values.isAvailable}
              onChange={set('isAvailable')}
            />
            <Toggle
              id="mi-popular"
              label="Mark as a signature dish"
              hint="Featured on the home page"
              checked={values.isPopular}
              onChange={set('isPopular')}
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary btn-md flex-1">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary btn-md flex-1">
            {saving && <Loader2 size={15} className="animate-spin" />}
            {item ? 'Save changes' : 'Add to menu'}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function Toggle({ id, label, hint, checked, onChange }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 accent-brand-600"
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-ink-400">{hint}</span>}
      </span>
    </label>
  );
}
