import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { money } from '../lib/format';

export default function ProductCard({ product }) {
  const addItem = useCartStore((s) => s.addItem);
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore((s) => s.show);
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  const inStock = (product.Inventory?.quantityInStock ?? 0) > 0;

  const handleAdd = () => {
    if (!user) {
      toast('Sign in to add items to your cart');
      navigate('/login');
      return;
    }
    addItem(product);
    toast(`${product.name} added to cart`);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group bg-white border border-black/5 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={`/products/${product.id}`}>
        <div className="aspect-square bg-gradient-to-b from-black/[0.03] to-black/[0.06] flex items-center justify-center overflow-hidden">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <span className="font-display text-4xl text-black/15">VX</span>
          )}
        </div>
      </Link>
      <div className="p-4">
        <p className="text-xs uppercase tracking-widest text-gold">{product.Brand?.name}</p>
        <Link to={`/products/${product.id}`}>
          <h3 className="font-display text-lg mt-1 leading-snug">{product.name}</h3>
        </Link>
        <p className="text-xs text-black/40 mt-0.5">
          {product.volumeMl ? `${product.volumeMl}ml` : ''} {product.fragranceType?.replace(/_/g, ' ')}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-medium">GHS {money(product.price)}</span>
          <button
            onClick={handleAdd}
            disabled={!inStock || added}
            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-colors disabled:cursor-not-allowed ${
              added
                ? 'bg-green-600 text-white'
                : 'bg-ink text-white hover:bg-gold disabled:opacity-30'
            }`}
          >
            {added ? <>Added <Check size={13} strokeWidth={2.5} /></> : inStock ? 'Add to cart' : 'Sold out'}
          </button>
        </div>
      </div>
    </div>
  );
}
