import { Link } from 'react-router-dom';
import Brandmark from './Brandmark';

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="flex items-center gap-2.5">
            <Brandmark size={32} />
            <span className="font-display text-base font-bold">Bistro Lumière</span>
          </div>
          <p className="mt-2 max-w-xs text-sm text-ink-400">
            Classic French cooking, delivered. No account required.
          </p>
          <p className="mt-1 text-xs text-ink-400">
            Allergen information is listed on every dish.
          </p>
        </div>

        <div className="flex items-center gap-5 text-sm text-ink-600">
          <Link to="/menu" className="hover:text-ink-900">La Carte</Link>
          <Link to="/track" className="hover:text-ink-900">Track order</Link>
          <Link to="/admin/login" className="hover:text-ink-900">Staff login</Link>
        </div>
      </div>

      <div className="border-t border-ink-100 py-4 text-center text-xs text-ink-400">
        © {new Date().getFullYear()} Bistro Lumière. Built with the MERN stack.
      </div>
    </footer>
  );
}
