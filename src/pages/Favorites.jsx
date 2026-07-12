import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';
import { useAuthStore } from '../store/authStore';

export default function Favorites() {
  const user = useAuthStore((s) => s.user);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (!user) return;
    api.get('/favorites').then((res) => setFavorites(res.data)).catch(() => {});
  }, [user]);

  if (!user) {
    return (
      <div className="text-center py-24">
        <h1 className="font-display text-3xl">Sign in to see your favourites</h1>
        <Link to="/login" className="inline-block mt-6 text-gold hover:underline">Sign in →</Link>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl">Your Favourites</h1>
      {favorites.length ? (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {favorites.map((f) => f.Product && <ProductCard key={f.id} product={f.Product} />)}
        </div>
      ) : (
        <p className="mt-8 text-black/40 text-sm">
          Nothing saved yet — tap ♡ on any perfume to keep it here.
        </p>
      )}
    </div>
  );
}
