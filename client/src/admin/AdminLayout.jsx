import { Navigate, NavLink, Outlet } from 'react-router-dom';
import { ExternalLink, LayoutDashboard, Loader2, LogOut, ReceiptText, UtensilsCrossed } from 'lucide-react';
import { useAuth } from './AuthContext';
import Brandmark from '../components/Brandmark';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ReceiptText },
  { to: '/admin/menu', label: 'La Carte', icon: UtensilsCrossed },
];

/** Gates every admin page. Unauthenticated visitors are sent to the login screen. */
export default function AdminLayout() {
  const { admin, checking, logout } = useAuth();

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-50">
        <Loader2 size={26} className="animate-spin text-brand-600" />
      </div>
    );
  }

  if (!admin) return <Navigate to="/admin/login" replace />;

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Brandmark size={36} tone="dark" />
            <div className="leading-tight">
              <p className="font-display text-sm font-extrabold">Bistro Lumière</p>
              <p className="text-[11px] text-ink-400">Restaurant admin</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900 sm:flex"
            >
              View site <ExternalLink size={13} />
            </a>

            <span className="hidden text-sm text-ink-600 sm:inline">
              {admin.name}
            </span>

            <button onClick={logout} className="btn-secondary btn-sm">
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-7xl gap-1 px-4 sm:px-6">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `-mb-px flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-ink-600 hover:text-ink-900'
                }`
              }
            >
              <Icon size={16} /> {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
