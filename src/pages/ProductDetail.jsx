import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart } from 'lucide-react';
import api, { resolveAssetUrl } from '../lib/api';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { money } from '../lib/format';
import CartFab from '../components/CartFab';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [favorited, setFavorited] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const toast = useToastStore((s) => s.show);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    api.get(`/products/${id}`).then((res) => setProduct(res.data)).catch(() => {});
  }, [id]);

  const toggleFavorite = async () => {
    if (!user) return toast('Sign in to save favourites', 'info');
    try {
      if (favorited) {
        await api.delete(`/favorites/${id}`);
        setFavorited(false);
      } else {
        await api.post('/favorites', { productId: id });
        setFavorited(true);
      }
    } catch { /* ignore */ }
  };

  if (!product) return <p className="text-center py-20 text-black/40">Loading…</p>;

  const inStock = (product.Inventory?.quantityInStock ?? 0) > 0;
  const notes = [
    ['Top', product.topNotes],
    ['Heart', product.heartNotes],
    ['Base', product.baseNotes],
  ].filter(([, v]) => v);

  return (
    <div className="w-full mx-auto max-w-5xl px-4 py-12 grid md:grid-cols-2 gap-12">
      <div className="aspect-square bg-white border border-black/5 rounded-lg flex items-center justify-center overflow-hidden">
        {product.imageUrl ? (
          <img src={resolveAssetUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-display text-6xl text-black/10">VX</span>
        )}
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest text-gold">{product.Brand?.name}</p>
        <h1 className="font-display text-4xl mt-2">{product.name}</h1>
        <p className="text-sm text-black/40 mt-1">
          {product.volumeMl && `${product.volumeMl}ml · `}{product.fragranceType?.replace(/_/g, ' ')}
        </p>
        <p className="text-2xl mt-4">GHS {money(product.price)}</p>
        <p className="mt-4 text-black/70 leading-relaxed">{product.description}</p>

        {notes.length > 0 && (
          <div className="mt-6 space-y-1">
            {notes.map(([label, value]) => (
              <p key={label} className="text-sm">
                <span className="text-gold uppercase text-xs tracking-widest mr-2">{label}</span>
                {value}
              </p>
            ))}
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <button
            onClick={() => {
              if (!user) {
                toast('Sign in to add items to your cart');
                navigate('/login');
                return;
              }
              addItem(product);
              toast(`${product.name} added to cart`);
            }}
            disabled={!inStock}
            className="px-8 py-3 rounded-full bg-ink text-white text-sm hover:bg-gold transition-colors disabled:opacity-30"
          >
            {inStock ? 'Add to Cart' : 'Sold Out'}
          </button>
          <button
            onClick={toggleFavorite}
            className={`flex items-center gap-1.5 px-6 py-3 rounded-full border text-sm transition-colors ${
              favorited ? 'border-gold text-gold' : 'border-black/20 hover:border-black'
            }`}
          >
            <Heart size={16} strokeWidth={2} fill={favorited ? 'currentColor' : 'none'} />
            {favorited ? 'Saved' : 'Favourite'}
          </button>
        </div>
      </div>

      <CartFab />
    </div>
  );
}
