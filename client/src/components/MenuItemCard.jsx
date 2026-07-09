import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Leaf, Minus, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatMoney } from '../lib/format';

export default function MenuItemCard({ item, index = 0 }) {
  const { addItem, setQuantity, quantityOf } = useCart();
  const quantity = quantityOf(item._id);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-100">
        {!imageLoaded && <div className="absolute inset-0 skeleton" />}
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            setImageLoaded(true);
            e.currentTarget.src =
              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23e8e4de"/><text x="50%" y="50%" text-anchor="middle" fill="%23918a80" font-family="Georgia,serif" font-size="16">No image</text></svg>';
          }}
          className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <div className="absolute left-3 top-3 flex gap-1.5">
          {item.isPopular && (
            <span className="chip bg-brand-600 text-ink-50 shadow-sm">Signature</span>
          )}
          {item.isVeg && (
            <span className="chip bg-white/95 text-green-800 shadow-sm">
              <Leaf size={12} /> Végétarien
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-base font-bold leading-snug">{item.name}</h3>
          <span className="shrink-0 font-display text-base font-bold text-brand-700">
            {formatMoney(item.price)}
          </span>
        </div>

        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-600">{item.description}</p>

        <div className="mt-3 flex items-center gap-3 text-xs text-ink-400">
          <span className="inline-flex items-center gap-1">
            <Clock size={13} /> {item.prepTimeMins} min
          </span>
        </div>

        {item.allergens?.length > 0 && (
          <p className="mt-2 text-[11px] leading-relaxed text-ink-400">
            <span className="font-semibold uppercase tracking-wide">Allergens:</span>{' '}
            {item.allergens.join(' · ')}
          </p>
        )}

        <div className="mt-4 pt-1">
          {quantity === 0 ? (
            <button onClick={() => addItem(item)} className="btn-primary btn-md w-full">
              <Plus size={16} /> Add to cart
            </button>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 p-1">
              <button
                onClick={() => setQuantity(item._id, quantity - 1)}
                aria-label={`Remove one ${item.name}`}
                className="grid h-9 w-9 place-items-center rounded-lg text-brand-700 transition hover:bg-white"
              >
                <Minus size={16} />
              </button>

              <span aria-live="polite" className="font-display text-sm font-bold text-brand-800">
                {quantity} in cart
              </span>

              <button
                onClick={() => setQuantity(item._id, quantity + 1)}
                aria-label={`Add one more ${item.name}`}
                className="grid h-9 w-9 place-items-center rounded-lg text-brand-700 transition hover:bg-white"
              >
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
