import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';

// Floating "View Cart" button shown while shopping (anyone with items in cart)
export default function CartFab() {
  const count = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));

  if (count === 0) return null;

  return (
    <Link
      to="/cart"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-6 py-3 rounded-full bg-ink text-white text-sm shadow-lg shadow-black/20 hover:bg-gold transition-colors"
    >
      <span>🛒</span>
      <span>View Cart</span>
      <span className="min-w-6 h-6 px-1.5 flex items-center justify-center rounded-full bg-gold text-ink text-xs font-semibold">
        {count}
      </span>
    </Link>
  );
}
