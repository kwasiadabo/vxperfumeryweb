import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bike, MapPin } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { confirmDialog } from '../../store/dialogStore';

const badge = {
  pending_delivery: 'bg-blue-100 text-blue-800',
  dispatched: 'bg-orange-100 text-orange-800',
};

const statusLabel = {
  pending_delivery: 'Awaiting Dispatch',
  dispatched: 'Out for Delivery',
};

export default function AdminDelivery() {
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore((s) => s.show);
  const navigate = useNavigate();
  const [riders, setRiders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dispatching, setDispatching] = useState(null);
  const [riderFilter, setRiderFilter] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    const [ridersRes, ordersRes] = await Promise.all([
      api.get('/admin/delivery-persons'),
      api.get('/admin/orders'),
    ]);
    setRiders(ridersRes.data);
    setOrders(ordersRes.data.filter((o) => ['pending_delivery', 'dispatched'].includes(o.status)));
  };

  useEffect(() => {
    if (!user?.isAdmin) return navigate('/');
    load().catch(() => {});
  }, [user, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user?.isAdmin) return null;

  const matchesSearch = (order) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const customer = order.User ? `${order.User.firstName} ${order.User.lastName}` : order.guestName;
    return [order.orderNumber, order.shippingAddress, customer, order.User?.phoneNumber, order.guestPhone]
      .filter(Boolean)
      .some((v) => v.toLowerCase().includes(q));
  };

  const matchesRider = (order) => {
    if (!riderFilter) return true;
    if (riderFilter === 'unassigned') return !order.DeliveryPerson;
    return order.DeliveryPerson?.id === riderFilter;
  };

  const unassigned = orders.filter((o) => o.status === 'pending_delivery' && !o.DeliveryPerson);
  // every order still in the delivery pipeline — awaiting dispatch or already out with a rider
  const deliveries = orders.filter((o) => matchesRider(o) && matchesSearch(o));

  const dispatch = async (order) => {
    const ok = await confirmDialog({
      title: 'Dispatch Order',
      message: `Dispatch ${order.orderNumber} with ${order.DeliveryPerson.name}? They'll receive it by SMS.`,
      confirmLabel: 'Dispatch',
    });
    if (!ok) return;
    setDispatching(order.id);
    try {
      const { data } = await api.post(`/admin/delivery-persons/${order.DeliveryPerson.id}/dispatch`, {
        orderIds: [order.id],
      });
      toast(`${order.orderNumber} dispatched${data.smsSent ? ' — notified by SMS' : ''}`);
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to dispatch order', 'error');
    } finally {
      setDispatching(null);
    }
  };

  return (
    <div className="w-full mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-4xl">Delivery Management</h1>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
          <label className="flex flex-col gap-1 text-xs font-medium text-black/60">Search
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Order #, customer, address…"
              className="w-full sm:w-56 px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none focus:border-gold"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-black/60">Rider
            <select
              value={riderFilter}
              onChange={(e) => setRiderFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none"
            >
              <option value="">All riders</option>
              <option value="unassigned">Unassigned</option>
              {riders.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
        </div>
      </div>

      {unassigned.length > 0 && (
        <p className="mt-4 text-sm bg-blue-50 text-blue-800 rounded-lg px-4 py-3">
          {unassigned.length} paid {unassigned.length === 1 ? 'order has' : 'orders have'} no rider yet —{' '}
          assign riders on the <Link to="/admin/orders" className="underline hover:text-gold">Orders page</Link>.
        </p>
      )}

      <h2 className="font-display text-2xl mt-8">Deliveries</h2>
      <p className="text-sm text-black/40 mt-1">
        Every order awaiting dispatch or already out with a rider. Dispatching sends that rider an SMS with the order;
        it disappears from here once the rider confirms delivery in the Rider Portal.
      </p>
      {deliveries.length ? (
        <div className="mt-4 bg-white border border-black/5 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/[0.03] text-left">
              <tr>
                <th className="px-3 py-3 font-medium">Order</th>
                <th className="px-3 py-3 font-medium">Customer</th>
                <th className="px-3 py-3 font-medium">Rider</th>
                <th className="px-3 py-3 font-medium">Address</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((order) => (
                <tr key={order.id} className="border-t border-black/5 align-top">
                  <td className="px-3 py-3 font-mono text-xs">{order.orderNumber}</td>
                  <td className="px-3 py-3 text-xs">
                    <p>{order.User ? `${order.User.firstName} ${order.User.lastName}` : order.guestName}</p>
                    <p className="text-black/40 mt-0.5">{order.User?.phoneNumber || order.guestPhone}</p>
                  </td>
                  <td className="px-3 py-3 text-xs whitespace-nowrap">
                    {order.DeliveryPerson ? (
                      <span className="inline-flex items-center gap-1">
                        <Bike size={13} strokeWidth={2} className="shrink-0" /> {order.DeliveryPerson.name}
                      </span>
                    ) : (
                      <span className="text-black/30">Unassigned</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-gold">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={11} strokeWidth={2} className="shrink-0" /> {order.shippingAddress}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${badge[order.status] || ''}`}>
                      {statusLabel[order.status] || order.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    {order.status === 'pending_delivery' && order.DeliveryPerson && (
                      <button
                        onClick={() => dispatch(order)}
                        disabled={dispatching === order.id}
                        className="shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full bg-ink text-white text-xs hover:bg-gold transition-colors disabled:opacity-40"
                      >
                        {dispatching === order.id ? 'Dispatching…' : 'Dispatch'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-black/40 text-sm">No deliveries match the current filters.</p>
      )}
    </div>
  );
}
