import { useState } from 'react';
import { MapPin } from 'lucide-react';
import api from '../lib/api';
import { money, formatDate } from '../lib/format';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  pending_delivery: 'bg-blue-100 text-blue-800',
  dispatched: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState('');
  const [contact, setContact] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const { data } = await api.get('/orders/lookup', { params: { orderNumber: orderNumber.trim(), contact: contact.trim() } });
      setOrder(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not find that order. Check the details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 border border-black/15 rounded-lg bg-white text-sm focus:outline-none focus:border-gold';
  const labelClass = 'flex flex-col gap-1 text-xs font-medium text-black/60';

  return (
    <div className="w-full mx-auto max-w-lg px-4 py-12">
      <h1 className="font-display text-4xl">Track Your Order</h1>
      <p className="mt-2 text-sm text-black/50">
        Enter your order number and the email or phone number used at checkout.
      </p>

      <form onSubmit={lookup} className="mt-8 space-y-4">
        <label className={labelClass}>Order number *
          <input
            required
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="VX-XXXXXXX-XXXX"
            className={`${inputClass} font-mono`}
          />
        </label>
        <label className={labelClass}>Email or phone number *
          <input
            required
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className={inputClass}
          />
        </label>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-full bg-ink text-white text-sm hover:bg-gold transition-colors disabled:opacity-40"
        >
          {loading ? 'Looking up…' : 'Track Order'}
        </button>
      </form>

      {order && (
        <div className="mt-8 bg-white border border-black/5 rounded-lg p-4">
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
      )}
    </div>
  );
}
