import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Bike } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { money, formatDate } from '../../lib/format';

const STATUSES = ['pending', 'pending_delivery', 'dispatched', 'delivered', 'cancelled'];

const badge = {
  pending: 'bg-yellow-100 text-yellow-800',
  pending_delivery: 'bg-blue-100 text-blue-800',
  dispatched: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function AdminOrders() {
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore((s) => s.show);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [filter, setFilter] = useState('');
  const [destination, setDestination] = useState('');
  const [riderFilter, setRiderFilter] = useState('');
  // defaults to today's orders; clear the field to see every date
  const [date, setDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const load = () => {
    setLoading(true);
    const params = {};
    if (filter) params.status = filter;
    if (destination) params.destination = destination;
    if (riderFilter) params.rider = riderFilter;
    if (date) params.date = date;
    api.get('/admin/orders', { params })
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user?.isAdmin) return navigate('/');
    const timer = setTimeout(load, destination ? 300 : 0); // debounce typing
    return () => clearTimeout(timer);
  }, [user, navigate, filter, destination, riderFilter, date]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user?.isAdmin) return;
    api.get('/admin/delivery-persons').then((res) => setRiders(res.data)).catch(() => {});
  }, [user]);

  if (!user?.isAdmin) return null;

  const changeStatus = async (order, status) => {
    if (status === order.status) return;
    setUpdating(order.id);
    try {
      await api.patch(`/admin/orders/${order.id}/status`, { status });
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to update status', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const assignRider = async (order, deliveryPersonId) => {
    setUpdating(order.id);
    try {
      await api.patch(`/admin/orders/${order.id}/assign`, { deliveryPersonId: deliveryPersonId || null });
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to assign rider', 'error');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="w-full mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl">Orders</h1>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-black/60">Order date (clear for all)
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none focus:border-gold"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-black/60">Destination
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="px-4 py-2 rounded-full border border-black/15 bg-white text-sm w-52 focus:outline-none focus:border-gold"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-black/60">Rider
            <select
              value={riderFilter}
              onChange={(e) => setRiderFilter(e.target.value)}
              className="px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none"
            >
              <option value="">All riders</option>
              <option value="unassigned">Unassigned</option>
              {riders.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-black/60">Status
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none"
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <p className="mt-12 text-center text-black/40">Loading orders…</p>
      ) : orders.length ? (
        <div className="mt-8 bg-white border border-black/5 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/[0.03] text-left">
              <tr>
                <th className="px-3 py-3 font-medium">Order</th>
                <th className="px-3 py-3 font-medium">Items</th>
                <th className="px-3 py-3 font-medium">Total</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Rider</th>
                <th className="px-3 py-3 font-medium">Update</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-black/5 align-top">
                  <td className="px-3 py-3">
                    <p className="font-mono text-xs">{order.orderNumber}</p>
                    <p className="text-xs mt-1">{order.User?.firstName} {order.User?.lastName}</p>
                    <p className="text-xs text-black/40">{order.User?.phoneNumber || order.User?.email}</p>
                    <p className="text-xs text-black/40 mt-0.5">{formatDate(order.createdAt)}</p>
                  </td>
                  <td className="px-3 py-3">
                    <ul className="space-y-0.5">
                      {order.OrderItems?.map((item) => (
                        <li key={item.id} className="text-xs">
                          {item.quantity}× {item.Product?.name}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-gold mt-1.5 flex items-center gap-1">
                      <MapPin size={12} strokeWidth={2} className="shrink-0" /> {order.shippingAddress || 'No address'}
                    </p>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-xs font-medium">GHS {money(order.totalAmount)}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${badge[order.status] || ''}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${order.paymentStatus === 'completed' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                        pay: {order.paymentStatus}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {order.status === 'pending_delivery' ? (
                      <select
                        value={order.DeliveryPerson?.id || ''}
                        disabled={updating === order.id}
                        onChange={(e) => assignRider(order, e.target.value)}
                        className="px-2 py-1 rounded border border-black/15 bg-white text-xs disabled:opacity-40"
                      >
                        <option value="">— Unassigned —</option>
                        {riders.filter((r) => r.isActive).map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    ) : order.DeliveryPerson ? (
                      <p className="text-xs whitespace-nowrap flex items-center gap-1">
                        <Bike size={13} strokeWidth={2} className="shrink-0" /> {order.DeliveryPerson.name}
                      </p>
                    ) : (
                      <span className="text-xs text-black/30">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={order.status}
                      disabled={updating === order.id}
                      onChange={(e) => changeStatus(order, e.target.value)}
                      className="px-2 py-1 rounded border border-black/15 bg-white text-xs disabled:opacity-40"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-12 text-center text-black/40">
          No orders{filter ? ` with status "${filter.replace(/_/g, ' ')}"` : ''}
          {date ? ` on ${formatDate(`${date}T00:00:00`)}` : ''} — clear the date filter to see all orders.
        </p>
      )}
    </div>
  );
}
