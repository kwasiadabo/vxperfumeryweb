import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { resolveAssetUrl } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { money } from '../../lib/format';

const emptyForm = {
  sku: '', name: '', description: '', price: '', volumeMl: '',
  fragranceType: 'eau_de_parfum', gender: 'unisex',
  topNotes: '', heartNotes: '', baseNotes: '',
  imageUrl: '', brandId: '', categoryId: '', quantityInStock: 0,
};

const GENDER_LABELS = { male: 'Men', female: 'Women', unisex: 'Unisex' };

// "Dior" + "Sauvage Eau de Parfum" + 100 -> "DIOR-SAUV-EAU-DE-PARF-100"
function generateSku(brandName, name, volumeMl) {
  const clean = (s) => s.replace(/[^a-z0-9 ]/gi, '').trim().split(/\s+/).filter(Boolean);
  const brandPart = clean(brandName)[0]?.slice(0, 6).toUpperCase() || '';
  const namePart = clean(name).map((w) => w.slice(0, 4).toUpperCase()).slice(0, 4).join('-');
  return [brandPart, namePart, volumeMl || null].filter(Boolean).join('-');
}

export default function AdminProducts() {
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore((s) => s.show);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null); // product being edited, or null = add mode
  const [restockQty, setRestockQty] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [skuTouched, setSkuTouched] = useState(false);
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState({ search: '', brand: '', gender: '' });
  const formRef = useRef(null);
  const fileInputRef = useRef(null);

  const loadProducts = () => {
    const params = { pageSize: 200 };
    if (filters.search) params.search = filters.search;
    if (filters.brand) params.brand = filters.brand;
    if (filters.gender) params.gender = filters.gender;
    api.get('/products', { params }).then((res) => {
      setProducts(res.data.products);
      setTotal(res.data.total);
    });
  };

  useEffect(() => {
    if (!user?.isAdmin) return navigate('/');
    api.get('/brands').then((res) => setBrands(res.data));
    api.get('/categories').then((res) => setCategories(res.data));
  }, [user, navigate]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    const timer = setTimeout(loadProducts, filters.search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [user, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-generate the SKU while adding, unless the admin typed one manually
  useEffect(() => {
    if (editing || skuTouched || !form.name) return;
    const brandName = brands.find((b) => b.id === form.brandId)?.name || '';
    setForm((f) => ({ ...f, sku: generateSku(brandName, f.name, f.volumeMl) }));
  }, [form.name, form.brandId, form.volumeMl, brands, editing, skuTouched]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user?.isAdmin) return null;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const setFilter = (key) => (e) => setFilters({ ...filters, [key]: e.target.value });

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setRestockQty('');
    setImageFile(null);
    setSkuTouched(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startEdit = (product) => {
    setEditing(product);
    setForm({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      price: product.price,
      volumeMl: product.volumeMl || '',
      fragranceType: product.fragranceType || 'eau_de_parfum',
      gender: product.gender || 'unisex',
      topNotes: product.topNotes || '',
      heartNotes: product.heartNotes || '',
      baseNotes: product.baseNotes || '',
      imageUrl: product.imageUrl || '',
      brandId: product.BrandId || '',
      categoryId: product.CategoryId || '',
      quantityInStock: product.Inventory?.quantityInStock ?? 0,
    });
    setRestockQty('');
    setImageFile(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      let imageUrl = form.imageUrl;
      if (imageFile) {
        const fd = new FormData();
        fd.append('image', imageFile);
        const { data } = await api.post('/admin/upload', fd);
        imageUrl = data.url;
      }
      const payload = { ...form, imageUrl, price: Number(form.price), volumeMl: form.volumeMl ? Number(form.volumeMl) : null };

      if (editing) {
        delete payload.quantityInStock; // stock changes go through restock below
        await api.patch(`/admin/products/${editing.id}`, payload);
        if (Number(restockQty) > 0) {
          await api.post(`/admin/products/${editing.id}/restock`, { quantity: Number(restockQty) });
        }
        toast(`${form.name} updated`);
      } else {
        payload.quantityInStock = Number(form.quantityInStock);
        await api.post('/admin/products', payload);
        toast(`${form.name} added`);
      }
      resetForm();
      loadProducts();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to save product');
    }
  };

  const inputClass = 'px-3 py-2 border border-black/15 rounded bg-white text-sm w-full focus:outline-none focus:border-gold';
  const labelClass = 'flex flex-col gap-1 text-xs font-medium text-black/60';

  return (
    <div className="w-full mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl">Products</h1>

      {/* Add / edit form */}
      <form ref={formRef} onSubmit={submit} className="mt-8 bg-white border border-black/5 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">
            {editing ? `Editing: ${editing.name}` : 'Add New Perfume'}
          </p>
          {editing && (
            <button type="button" onClick={resetForm} className="text-xs text-black/40 hover:text-red-500">
              Cancel edit
            </button>
          )}
        </div>
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <label className={labelClass}>Perfume name *
            <input required value={form.name} onChange={set('name')} className={inputClass} />
          </label>
          <label className={labelClass}>Price (GHS) *
            <input required type="number" step="0.01" min="0" value={form.price} onChange={set('price')} className={inputClass} />
          </label>
          <label className={labelClass}>Brand
            <select value={form.brandId} onChange={set('brandId')} className={inputClass}>
              <option value="">Select a brand</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <label className={labelClass}>Scent family
            <select value={form.categoryId} onChange={set('categoryId')} className={inputClass}>
              <option value="">Select a category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className={labelClass}>Fragrance type
            <select value={form.fragranceType} onChange={set('fragranceType')} className={inputClass}>
              <option value="eau_de_parfum">Eau de Parfum</option>
              <option value="eau_de_toilette">Eau de Toilette</option>
              <option value="parfum">Parfum</option>
              <option value="cologne">Cologne</option>
            </select>
          </label>
          <label className={labelClass}>Gender
            <select value={form.gender} onChange={set('gender')} className={inputClass}>
              <option value="male">Men</option>
              <option value="female">Women</option>
              <option value="unisex">Unisex</option>
            </select>
          </label>
          <label className={labelClass}>Volume (ml)
            <input type="number" min="0" value={form.volumeMl} onChange={set('volumeMl')} className={inputClass} />
          </label>
          {editing ? (
            <label className={labelClass}>Add stock (current: {editing.Inventory?.quantityInStock ?? 0})
              <input type="number" min="0" value={restockQty} onChange={(e) => setRestockQty(e.target.value)}
                className={inputClass} />
            </label>
          ) : (
            <label className={labelClass}>Initial stock
              <input type="number" min="0" value={form.quantityInStock} onChange={set('quantityInStock')} className={inputClass} />
            </label>
          )}
          <label className={labelClass}>Top notes
            <input value={form.topNotes} onChange={set('topNotes')} className={inputClass} />
          </label>
          <label className={labelClass}>Heart notes
            <input value={form.heartNotes} onChange={set('heartNotes')} className={inputClass} />
          </label>
          <label className={labelClass}>Base notes
            <input value={form.baseNotes} onChange={set('baseNotes')} className={inputClass} />
          </label>
          <label className={labelClass}>Product image
            <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0] || null)}
              className={`${inputClass} file:mr-2 file:px-3 file:py-1 file:rounded-full file:border-0 file:bg-ink file:text-white file:text-xs`} />
          </label>
          <label className={labelClass}>Or image URL
            <input value={form.imageUrl} onChange={set('imageUrl')} className={inputClass} />
          </label>
          <label className={`${labelClass} md:col-span-3`}>Description
            <textarea value={form.description} onChange={set('description')} className={inputClass} rows={2} />
          </label>
          <label className={labelClass}>SKU * (auto-generated — edit to override)
            <input
              required
              value={form.sku}
              onChange={(e) => { setSkuTouched(e.target.value !== ''); setForm({ ...form, sku: e.target.value }); }}
              className={inputClass}
            />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button type="submit" className="px-6 py-2 rounded-full bg-ink text-white text-sm hover:bg-gold transition-colors">
            {editing ? 'Save Changes' : 'Add Product'}
          </button>
          {message && <span className="text-sm text-red-600">{message}</span>}
        </div>
      </form>

      {/* Search & filters */}
      <div className="mt-10 flex flex-wrap items-end gap-3">
        <label className={labelClass}>Search products
          <input
            value={filters.search}
            onChange={setFilter('search')}
            className="px-4 py-2 rounded-full border border-black/15 bg-white text-sm w-56 focus:outline-none focus:border-gold"
          />
        </label>
        <label className={labelClass}>Brand
          <select value={filters.brand} onChange={setFilter('brand')}
            className="px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none">
            <option value="">All brands</option>
            {brands.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
          </select>
        </label>
        <label className={labelClass}>Gender
          <select value={filters.gender} onChange={setFilter('gender')}
            className="px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none">
            <option value="">All genders</option>
            <option value="male">Men</option>
            <option value="female">Women</option>
            <option value="unisex">Unisex</option>
          </select>
        </label>
        <span className="text-sm text-black/40 pb-2">{total} products</span>
      </div>

      {/* Product table */}
      <div className="mt-4 bg-white border border-black/5 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-black/[0.03] text-left">
            <tr>
              <th className="px-3 py-3 font-medium">Product</th>
              <th className="px-3 py-3 font-medium">Brand</th>
              <th className="px-3 py-3 font-medium">Gender</th>
              <th className="px-3 py-3 font-medium">Price</th>
              <th className="px-3 py-3 font-medium">Stock</th>
              <th className="px-3 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className={`border-t border-black/5 ${editing?.id === p.id ? 'bg-gold/5' : ''}`}>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black/5 rounded overflow-hidden shrink-0">
                      {p.imageUrl && <img src={resolveAssetUrl(p.imageUrl)} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate">{p.name}</p>
                      <p className="font-mono text-[10px] text-black/40">{p.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5">{p.Brand?.name}</td>
                <td className="px-3 py-2.5">{GENDER_LABELS[p.gender] || 'Unisex'}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">GHS {money(p.price)}</td>
                <td className="px-3 py-2.5">
                  <span className={p.Inventory?.quantityInStock <= 5 ? 'text-red-600 font-medium' : ''}>
                    {p.Inventory?.quantityInStock ?? 0}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button onClick={() => startEdit(p)}
                    className="text-xs px-4 py-1.5 rounded-full border border-black/15 hover:border-gold hover:text-gold transition-colors">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
