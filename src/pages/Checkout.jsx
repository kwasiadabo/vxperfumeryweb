import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { money } from '../lib/format';
import { GHANA_REGIONS } from '../lib/regions';

export default function Checkout() {
  const { items, clear } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [checkingOutAsGuest, setCheckingOutAsGuest] = useState(false);
  const [guest, setGuest] = useState({ name: '', email: '', phone: '' });
  const [delivery, setDelivery] = useState({ address: '', street: '', area: '', region: '' });
  const [cityChoice, setCityChoice] = useState(''); // a configured city, or 'Other'
  const [otherCity, setOtherCity] = useState(''); // free text when 'Other'
  const [fees, setFees] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/delivery-fees').then((res) => setFees(res.data)).catch(() => {});
  }, []);

  const setField = (key) => (e) => {
    const next = { ...delivery, [key]: e.target.value };
    setDelivery(next);
    if (key === 'region') {
      setCityChoice('');
      setOtherCity('');
    }
  };

  // cities configured for the selected region ('Other' fallback excluded from the list)
  const regionFees = fees.filter((f) => f.region === delivery.region);
  const cityOptions = regionFees.filter((f) => f.city !== 'Other');
  const fallbackFee = regionFees.find((f) => f.city === 'Other');

  const city = cityChoice === 'Other' ? otherCity : cityChoice;
  const selectedCityFee = regionFees.find((f) => f.city === cityChoice);
  const shippingCost = Number(selectedCityFee?.fee ?? fallbackFee?.fee ?? 20);

  const subtotal = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
  const total = subtotal + shippingCost;

  if (!user && !checkingOutAsGuest) {
    return (
      <div className="text-center py-24">
        <h1 className="font-display text-3xl">Checkout</h1>
        <p className="mt-3 text-black/50 text-sm">Sign in for order history and faster checkout next time, or continue without an account.</p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <button onClick={() => navigate('/login')} className="px-8 py-3 rounded-full bg-ink text-white text-sm hover:bg-gold transition-colors">
            Sign in
          </button>
          <button onClick={() => setCheckingOutAsGuest(true)} className="text-sm text-black/60 hover:text-gold underline underline-offset-2">
            Continue as guest
          </button>
        </div>
      </div>
    );
  }

  const placeOrder = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      let data;
      if (user) {
        // Sync local cart to the server cart, then create the order
        await api.delete('/cart').catch(() => {});
        for (const item of items) {
          await api.post('/cart/items', { productId: item.product.id, quantity: item.quantity });
        }
        ({ data } = await api.post('/orders', { ...delivery, city, shippingCost }));
      } else {
        // Guest checkout — no server-side cart to build from, so the local
        // cart items are sent directly alongside the guest's contact info.
        ({ data } = await api.post('/orders', {
          ...delivery,
          city,
          shippingCost,
          guestName: guest.name,
          guestEmail: guest.email,
          guestPhone: guest.phone,
          items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        }));
      }
      clear();
      window.location.href = data.paymentUrl; // hand off to Paystack
    } catch (err) {
      setError(err.response?.data?.error || 'Could not place order. Please try again.');
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 border border-black/15 rounded-lg bg-white text-sm focus:outline-none focus:border-gold';
  const labelClass = 'flex flex-col gap-1 text-xs font-medium text-black/60';

  return (
    <div className="w-full mx-auto max-w-lg px-4 py-12">
      <h1 className="font-display text-4xl">Checkout</h1>
      <form onSubmit={placeOrder} className="mt-8 space-y-4">
        {!user && (
          <div className="bg-white border border-black/5 rounded-lg p-4 space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Contact Details</p>
            <label className={labelClass}>Full name *
              <input
                required
                value={guest.name}
                onChange={(e) => setGuest({ ...guest, name: e.target.value })}
                className={inputClass}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>Email *
                <input
                  required
                  type="email"
                  value={guest.email}
                  onChange={(e) => setGuest({ ...guest, email: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>Phone *
                <input
                  required
                  type="tel"
                  value={guest.phone}
                  onChange={(e) => setGuest({ ...guest, phone: e.target.value })}
                  className={inputClass}
                />
              </label>
            </div>
            <p className="text-xs text-black/40">
              We'll text order updates to this number — keep your order number and these details to track it later.
            </p>
          </div>
        )}
        <div className="bg-white border border-black/5 rounded-lg p-4 space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Delivery Details</p>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>Region *
              <select
                required
                value={delivery.region}
                onChange={setField('region')}
                className={`${inputClass} ${delivery.region ? '' : 'text-black/40'}`}
              >
                <option value="">— Select region —</option>
                {GHANA_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label className={labelClass}>City or town *
              <select
                required
                value={cityChoice}
                onChange={(e) => setCityChoice(e.target.value)}
                disabled={!delivery.region}
                className={`${inputClass} disabled:opacity-40 ${cityChoice ? '' : 'text-black/40'}`}
              >
                <option value="">{delivery.region ? '— Select city —' : 'Pick a region first'}</option>
                {cityOptions.map((f) => (
                  <option key={f.id} value={f.city}>{f.city}</option>
                ))}
                <option value="Other">Other…</option>
              </select>
            </label>
          </div>
          {cityChoice === 'Other' && (
            <label className={labelClass}>Your city or town *
              <input
                required
                value={otherCity}
                onChange={(e) => setOtherCity(e.target.value)}
                className={inputClass}
              />
            </label>
          )}
          <label className={labelClass}>Area or locality (e.g. East Legon)
            <input
              value={delivery.area}
              onChange={setField('area')}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>Street
            <input
              value={delivery.street}
              onChange={setField('street')}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>Address * (house no. / landmark)
            <input
              required
              value={delivery.address}
              onChange={setField('address')}
              className={inputClass}
            />
          </label>
        </div>
        <div className="bg-white border border-black/5 rounded-lg p-4 text-sm space-y-1">
          <div className="flex justify-between"><span>Subtotal</span><span>GHS {money(subtotal)}</span></div>
          <div className="flex justify-between">
            <span>Delivery{city ? ` (${city}, ${delivery.region})` : delivery.region ? ` (${delivery.region})` : ''}</span>
            <span>GHS {money(shippingCost)}</span>
          </div>
          <div className="flex justify-between font-medium text-base pt-2 border-t border-black/10">
            <span>Total</span><span>GHS {money(total)}</span>
          </div>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !items.length}
          className="w-full py-3 rounded-full bg-ink text-white text-sm hover:bg-gold transition-colors disabled:opacity-40"
        >
          {submitting ? 'Redirecting to Paystack…' : `Pay GHS ${money(total)} with Paystack`}
        </button>
        <p className="text-xs text-black/40 text-center">
          Secured by Paystack · Card & Mobile Money accepted · SMS confirmation via Nalo
        </p>
      </form>
    </div>
  );
}
