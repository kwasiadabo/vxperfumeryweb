import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { money, formatDate } from '../lib/format';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  pending_delivery: 'bg-blue-100 text-blue-800',
  dispatched: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function Account() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return navigate('/login');
    api.get('/orders').then((res) => setOrders(res.data)).catch(() => {});
  }, [user, navigate]);

  // brands that actually appear in this user's purchase history
  const brands = useMemo(() => {
    const names = new Set();
    for (const order of orders) {
      for (const item of order.OrderItems || []) {
        if (item.Product?.Brand?.name) names.add(item.Product.Brand.name);
      }
    }
    return [...names].sort();
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      if (search) {
        const q = search.toLowerCase();
        const haystack = [
          order.orderNumber,
          order.shippingAddress,
          ...(order.OrderItems || []).map((i) => `${i.Product?.name} ${i.Product?.Brand?.name}`),
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (brand && !(order.OrderItems || []).some((i) => i.Product?.Brand?.name === brand)) return false;
      const created = new Date(order.createdAt);
      if (fromDate && created < new Date(fromDate)) return false;
      if (toDate && created > new Date(`${toDate}T23:59:59`)) return false;
      return true;
    });
  }, [orders, search, brand, fromDate, toDate]);

  if (!user) return null;

  const filterInput = 'px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none focus:border-gold';

  return (
    <div className="w-full mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl">Hello, {user.firstName}</h1>

      <div className="mt-8 bg-white border border-black/5 rounded-lg p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Account Details</p>
        <div className="mt-3 grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-black/40">Name</p>
            <p className="mt-0.5">{user.firstName} {user.lastName}</p>
          </div>
          <div>
            <p className="text-black/40">Email</p>
            <p className="mt-0.5 break-all">{user.email}</p>
          </div>
          <div>
            <p className="text-black/40">Phone</p>
            <p className="mt-0.5">{user.phoneNumber || '—'}</p>
          </div>
        </div>
      </div>

      <h2 className="font-display text-2xl mt-10">Purchase History</h2>

      {orders.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex flex-col gap-1 text-xs font-medium text-black/60">Search orders
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${filterInput} w-full sm:w-48`}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-black/60">Brand
            <select value={brand} onChange={(e) => setBrand(e.target.value)} className={`${filterInput} w-full sm:w-auto`}>
              <option value="">All brands</option>
              {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3 sm:contents">
            <label className="flex flex-col gap-1 text-xs font-medium text-black/60">From date
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={`${filterInput} w-full sm:w-auto`} />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-black/60">To date
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={`${filterInput} w-full sm:w-auto`} />
            </label>
          </div>
        </div>
      )}

      {filtered.length ? (
        <div className="mt-4 space-y-3">
          {filtered.map((order) => (
            <div key={order.id} className="bg-white border border-black/5 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm">{order.orderNumber}</span>
                <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColors[order.status] || ''}`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-sm text-black/50 mt-1">
                {formatDate(order.createdAt)} · GHS {money(order.totalAmount)}
              </p>
              <ul className="mt-2 text-sm text-black/70">
                {order.OrderItems?.map((item) => (
                  <li key={item.id}>
                    {item.quantity}× {item.Product?.name} <span className="text-black/40">({item.Product?.Brand?.name})</span>
                  </li>
                ))}
              </ul>
              {order.shippingAddress && (
                <p className="mt-2 text-sm text-gold flex items-center gap-1.5">
                  <MapPin size={14} strokeWidth={2} className="shrink-0" /> Delivering to: {order.shippingAddress}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-black/40 text-sm">
          {orders.length ? 'No orders match your filters.' : 'No orders yet.'}
        </p>
      )}
    </div>
  );
}
