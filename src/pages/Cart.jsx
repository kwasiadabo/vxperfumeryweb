import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { money } from '../lib/format';

export default function Cart() {
  const { items, updateQuantity, removeItem } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const subtotal = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  if (!user) return null;

  if (!items.length) {
    return (
      <div className="text-center py-24">
        <h1 className="font-display text-3xl">Your cart is empty</h1>
        <Link to="/products" className="inline-block mt-6 text-gold hover:underline">
          Browse the collection →
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl">Your Cart</h1>
      <div className="mt-8 space-y-4">
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="flex items-center gap-4 bg-white border border-black/5 rounded-lg p-4">
            <div className="w-16 h-16 bg-black/5 rounded flex items-center justify-center shrink-0 overflow-hidden">
              {product.imageUrl
                ? <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                : <span className="font-display text-black/20">VX</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-widest text-gold">{product.Brand?.name}</p>
              <p className="font-medium truncate">{product.name}</p>
              <p className="text-sm text-black/50">GHS {money(product.price)}</p>
            </div>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => updateQuantity(product.id, Number(e.target.value))}
              className="w-16 px-2 py-1 border border-black/15 rounded text-center text-sm"
            />
            <button onClick={() => removeItem(product.id)} className="text-black/30 hover:text-red-500 text-sm">
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="mt-8 flex items-center justify-between border-t border-black/10 pt-6">
        <p className="text-lg">Subtotal: <strong>GHS {money(subtotal)}</strong></p>
        <Link
          to="/checkout"
          className="px-8 py-3 rounded-full bg-ink text-white text-sm hover:bg-gold transition-colors"
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}
