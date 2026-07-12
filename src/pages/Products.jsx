import { useEffect, useState } from 'react';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';
import CartFab from '../components/CartFab';

const PAGE_SIZE = 24;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/brands').then((res) => setBrands(res.data)).catch(() => {});
    api.get('/categories').then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  // reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, brand, category, gender]);

  useEffect(() => {
    setLoading(true);
    const params = { page, pageSize: PAGE_SIZE };
    if (search) params.search = search;
    if (brand) params.brand = brand;
    if (category) params.category = category;
    if (gender) params.gender = gender;
    const timer = setTimeout(() => {
      api.get('/products', { params })
        .then((res) => {
          setTotal(res.data.total);
          setProducts((prev) => (page === 1 ? res.data.products : [...prev, ...res.data.products]));
        })
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, brand, category, gender, page]);

  return (
    <div className="w-full mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl">The Collection</h1>
      <div className="mt-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-black/60">Search
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 rounded-full border border-black/15 bg-white text-sm w-64 focus:outline-none focus:border-gold"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-black/60">Brand
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none"
          >
            <option value="">All brands</option>
            {brands.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-black/60">For
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none"
          >
            <option value="">Everyone</option>
            <option value="male">Him</option>
            <option value="female">Her</option>
            <option value="unisex">Unisex</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-black/60">Scent family
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none"
          >
            <option value="">All scent families</option>
            {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </label>
        {total > 0 && (
          <span className="text-sm text-black/40 pb-2">
            Showing {products.length} of {total} perfumes
          </span>
        )}
      </div>

      {loading && page === 1 ? (
        <p className="mt-12 text-center text-black/40">Loading…</p>
      ) : products.length ? (
        <>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          {products.length < total && (
            <div className="mt-10 text-center">
              <button
                onClick={() => setPage(page + 1)}
                disabled={loading}
                className="px-8 py-3 rounded-full border border-black/20 text-sm hover:border-gold hover:text-gold transition-colors disabled:opacity-40"
              >
                {loading ? 'Loading…' : `Load more (${total - products.length} remaining)`}
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="mt-12 text-center text-black/40">No perfumes found.</p>
      )}

      <CartFab />
    </div>
  );
}
