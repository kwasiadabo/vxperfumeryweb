import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { money } from '../../lib/format';
import RevenueTrendChart from '../../components/RevenueTrendChart';

const toISODate = (d) => d.toLocaleDateString('en-CA');

export default function AdminProductSalesTrend() {
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore((s) => s.show);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState('');
  const [from, setFrom] = useState(() => toISODate(new Date(Date.now() - 30 * 24 * 3600 * 1000)));
  const [to, setTo] = useState(() => toISODate(new Date()));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.isAdmin) return;
    api.get('/products', { params: { pageSize: 100 } })
      .then((res) => setProducts(res.data.products))
      .catch(() => {});
  }, [user]);

  if (!user?.isAdmin) {
    navigate('/');
    return null;
  }

  const generate = async () => {
    if (!productId) return toast('Select a product first', 'info');
    setLoading(true);
    try {
      const res = await api.get('/admin/reports/product-sales', { params: { productId, from, to } });
      setReport(res.data);
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to load report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none focus:border-gold';

  return (
    <div className="w-full mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-display text-4xl">Product Sales Trend</h1>
      <p className="mt-2 text-sm text-black/50">
        See how a single product has sold over a selected period.
      </p>

      <div className="mt-8 bg-white border border-black/5 rounded-lg p-5 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-xs font-medium text-black/60">Product
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className={`${inputClass} w-56`}>
            <option value="">Select a product…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.Brand?.name ? `${p.Brand.name} — ` : ''}{p.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-black/60">From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-black/60">To
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} />
        </label>
        <button
          onClick={generate}
          disabled={loading}
          className="px-6 py-2.5 rounded-full bg-ink text-white text-sm hover:bg-gold transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Generate Chart'}
        </button>
      </div>

      {report && (
        <>
          <div className="mt-4 bg-white border border-black/5 rounded-lg p-5 grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-black/40">Product</p>
              <p className="mt-0.5 font-medium">{report.product.name}</p>
            </div>
            <div>
              <p className="text-black/40">Units Sold</p>
              <p className="mt-0.5 font-medium">{report.totals.totalUnitsSold}</p>
            </div>
            <div>
              <p className="text-black/40">Total Revenue</p>
              <p className="mt-0.5 font-semibold text-gold">GHS {money(report.totals.totalRevenue)}</p>
            </div>
          </div>

          <div className="mt-4 bg-white border border-black/5 rounded-lg p-5">
            <p className="text-xs uppercase tracking-widest text-black/40 mb-4">
              {report.product.name} — Units Sold Trend
            </p>
            <RevenueTrendChart
              data={report.daily.map((d) => ({ day: d.day, revenue: d.revenue, orders: d.unitsSold }))}
              unitLabel="unit"
            />
          </div>
        </>
      )}
    </div>
  );
}
