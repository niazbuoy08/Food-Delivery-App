import { Link, NavLink, useLocation } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Brandmark from './Brandmark';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/menu', label: 'La Carte' },
  { to: '/track', label: 'Track order' },
];

export default function Navbar() {
  const { totals } = useCart();
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100/80 bg-ink-50/85 backdrop-blur-lg">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <Brandmark size={36} />
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold">Bistro Lumière</span>
            <span className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-ink-400">
              Depuis 1954
            </span>
          </span>
        </Link>

        <div className="ml-auto hidden items-center gap-1 sm:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-ink-100 text-ink-900' : 'text-ink-600 hover:text-ink-900'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <Link
          to="/cart"
          aria-label={`Cart, ${totals.itemCount} item${totals.itemCount === 1 ? '' : 's'}`}
          className={`btn btn-sm ml-auto sm:ml-0 relative ${
            pathname === '/cart' ? 'btn-secondary' : 'btn-primary'
          }`}
        >
          <ShoppingBag size={16} />
          <span className="hidden sm:inline">Cart</span>
          {totals.itemCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink-50 px-1 text-[11px] font-bold text-brand-700">
              {totals.itemCount}
            </span>
          )}
        </Link>
      </nav>

      {/* Mobile nav sits below the bar so the cart button stays reachable. */}
      <div className="flex gap-1 border-t border-ink-100/80 px-4 py-1.5 sm:hidden">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex-1 rounded-lg py-1.5 text-center text-xs font-medium transition ${
                isActive ? 'bg-ink-100 text-ink-900' : 'text-ink-600'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </header>
  );
}
