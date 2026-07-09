import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-28 text-center">
      <p className="font-display text-6xl font-extrabold text-brand-200">404</p>
      <h1 className="mt-4 font-display text-2xl font-extrabold">This page doesn't exist</h1>
      <p className="mt-2 text-ink-600">The link may be old, or we may have moved things around.</p>
      <Link to="/" className="btn-primary btn-lg mt-8">
        Back to the menu
      </Link>
    </div>
  );
}
