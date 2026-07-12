import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    api.get('/products/recommendations')
      .then((res) => setRecommended(res.data))
      .catch(() => {});
  }, []);

  return (
    <div>
      <section className="bg-ink text-white">
        <div className="w-full mx-auto max-w-6xl px-4 py-24 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold-light">Fine Fragrances</p>
          <h1 className="font-display text-5xl md:text-6xl mt-4 leading-tight">
            Discover Your Signature Scent
          </h1>
          <p className="mt-4 text-white/60 max-w-xl mx-auto">
            Curated perfumes from the world's finest houses, delivered to your door.
          </p>
          <Link
            to="/products"
            className="inline-block mt-8 px-8 py-3 rounded-full bg-gold text-white text-sm tracking-wide hover:bg-gold-light transition-colors"
          >
            Shop the Collection
          </Link>
        </div>
      </section>

      <section className="w-full mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-3xl text-center">Recommended for You</h2>
        {recommended.length ? (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {recommended.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <p className="mt-8 text-center text-black/40 text-sm">
            Our collection is being stocked — check back soon.
          </p>
        )}
      </section>
    </div>
  );
}
