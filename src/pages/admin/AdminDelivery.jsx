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

export default function AdminDelivery() {
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore((s) => s.show);
  const navigate = useNavigate();
  const [riders, setRiders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dispatching, setDispatching] = useState(null);

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

  const pending = orders.filter((o) => o.status === 'pending_delivery');
  const unassigned = pending.filter((o) => !o.DeliveryPerson);
  // dispatch runs: riders with assigned orders still awaiting dispatch
  const runs = riders
    .map((rider) => ({ rider, orders: pending.filter((o) => o.DeliveryPerson?.id === rider.id) }))
    .filter((run) => run.orders.length);
  // orders already out with a rider, awaiting delivery confirmation
  const outForDelivery = riders
    .map((rider) => ({
      rider,
      orders: orders.filter((o) => o.status === 'dispatched' && o.DeliveryPerson?.id === rider.id),
    }))
    .filter((run) => run.orders.length);

  const dispatch = async (run) => {
    const ok = await confirmDialog({
      title: 'Dispatch Rider',
      message: `Dispatch ${run.rider.name} with ${run.orders.length} order(s)? They'll receive the full route by SMS.`,
      confirmLabel: 'Dispatch',
    });
    if (!ok) return;
    setDispatching(run.rider.id);
    try {
      const { data } = await api.post(`/admin/delivery-persons/${run.rider.id}/dispatch`);
      toast(`${run.rider.name} dispatched with ${data.dispatched.length} order(s)${data.smsSent ? ' — route sent by SMS' : ''}`);
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to dispatch rider', 'error');
    } finally {
      setDispatching(null);
    }
  };

  return (
    <div className="w-full mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl">Delivery Management</h1>

      {unassigned.length > 0 && (
        <p className="mt-4 text-sm bg-blue-50 text-blue-800 rounded-lg px-4 py-3">
          {unassigned.length} paid {unassigned.length === 1 ? 'order has' : 'orders have'} no rider yet —{' '}
          assign riders on the <Link to="/admin/orders" className="underline hover:text-gold">Orders page</Link>.
        </p>
      )}

      {/* Dispatch each rider with their assigned run */}
      <h2 className="font-display text-2xl mt-8">Dispatch Riders</h2>
      <p className="text-sm text-black/40 mt-1">
        Send a rider out with everything assigned to them — one SMS with the full route.
        Only dispatched orders can be confirmed as delivered.
      </p>
      {runs.length ? (
        <div className="mt-4 space-y-4">
          {runs.map((run) => (
            <div key={run.rider.id} className="bg-white border border-black/5 rounded-lg p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium flex items-center gap-1.5"><Bike size={15} strokeWidth={2} className="shrink-0" /> {run.rider.name}</p>
                  <p className="text-xs text-black/40">{run.rider.phoneNumber}</p>
                </div>
                <button
                  onClick={() => dispatch(run)}
                  disabled={dispatching === run.rider.id}
                  className="shrink-0 px-5 py-2 rounded-full bg-ink text-white text-xs hover:bg-gold transition-colors disabled:opacity-40"
                >
                  {dispatching === run.rider.id
                    ? 'Dispatching…'
                    : `Dispatch ${run.orders.length} ${run.orders.length === 1 ? 'order' : 'orders'}`}
                </button>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-black/40 border-t border-black/5">
                      <th className="py-2 pr-3 font-medium">#</th>
                      <th className="py-2 pr-3 font-medium">Order</th>
                      <th className="py-2 font-medium">Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {run.orders.map((order, i) => (
                      <tr key={order.id} className="border-t border-black/5">
                        <td className="py-2 pr-3 text-black/40">{i + 1}</td>
                        <td className="py-2 pr-3 font-mono">{order.orderNumber}</td>
                        <td className="py-2 text-gold">
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={11} strokeWidth={2} className="shrink-0" /> {order.shippingAddress}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-black/40 text-sm">No riders have orders waiting to be dispatched.</p>
      )}

      {/* Out for delivery — dispatched, awaiting rider confirmation */}
      <h2 className="font-display text-2xl mt-10">Out for Delivery</h2>
      <p className="text-sm text-black/40 mt-1">
        Dispatched orders — each disappears when its rider confirms delivery in the Rider Portal.
      </p>
      {outForDelivery.length ? (
        <div className="mt-4 space-y-4">
          {outForDelivery.map((run) => (
            <div key={run.rider.id} className="bg-white border border-black/5 rounded-lg p-5">
              <p className="font-medium flex items-center gap-1.5"><Bike size={15} strokeWidth={2} className="shrink-0" /> {run.rider.name}</p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-black/40 border-t border-black/5">
                      <th className="py-2 pr-3 font-medium">Order</th>
                      <th className="py-2 pr-3 font-medium">Address</th>
                      <th className="py-2 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {run.orders.map((order) => (
                      <tr key={order.id} className="border-t border-black/5">
                        <td className="py-2 pr-3 font-mono">{order.orderNumber}</td>
                        <td className="py-2 pr-3 text-gold">
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={11} strokeWidth={2} className="shrink-0" /> {order.shippingAddress}
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          <span className={`px-2 py-0.5 rounded-full capitalize ${badge[order.status]}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-black/40 text-sm">No orders currently out for delivery.</p>
      )}
    </div>
  );
}
