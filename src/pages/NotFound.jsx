import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-24 text-center">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gold">404</p>
        <h1 className="font-display text-4xl mt-4">Page not found</h1>
        <p className="mt-3 text-black/50 max-w-sm mx-auto">
          The page you're looking for doesn't exist or may have moved.
        </p>
        <Link
          to="/"
          className="inline-block mt-8 px-8 py-3 rounded-full bg-ink text-white text-sm hover:bg-gold transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
