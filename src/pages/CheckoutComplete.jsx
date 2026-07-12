import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import api from '../lib/api';
import { money } from '../lib/format';

export default function CheckoutComplete() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const reference = params.get('reference') || params.get('trxref');
  const [state, setState] = useState({ phase: 'verifying' }); // verifying | success | pending | error
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    if (!reference) {
      setState({ phase: 'error' });
      return;
    }
    api.get('/payments/verify', { params: { reference } })
      .then((res) => {
        setState({
          phase: res.data.paymentStatus === 'completed' ? 'success' : 'pending',
          order: res.data,
        });
      })
      .catch(() => setState({ phase: 'error' }));
  }, [reference]);

  // successful payments head back to the shop automatically
  useEffect(() => {
    if (state.phase !== 'success') return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          navigate('/products');
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [state.phase, navigate]);

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        {state.phase === 'verifying' && (
          <>
            <h1 className="font-display text-4xl">Confirming your payment…</h1>
            <p className="mt-4 text-black/50 text-sm">One moment please.</p>
          </>
        )}

        {state.phase === 'success' && (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
              <Check size={30} strokeWidth={2} />
            </div>
            <h1 className="font-display text-4xl mt-6">Thank You!</h1>
            <p className="mt-3 text-black/70">
              Payment received for order <span className="font-mono">{state.order.orderNumber}</span>
              {' '}(GHS {money(state.order.totalAmount)}).
            </p>
            <p className="mt-1 text-sm text-black/50">
              A confirmation SMS is on its way. We'll text you again when your order ships.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link to="/products" className="px-8 py-3 rounded-full bg-ink text-white text-sm hover:bg-gold transition-colors">
                Continue Shopping
              </Link>
              <Link to="/account" className="px-8 py-3 rounded-full border border-black/20 text-sm hover:border-gold hover:text-gold transition-colors">
                View My Orders
              </Link>
            </div>
            <p className="mt-6 text-xs text-black/40">
              Taking you back to the shop in {countdown}s…
            </p>
          </>
        )}

        {state.phase === 'pending' && (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center text-3xl">⏳</div>
            <h1 className="font-display text-4xl mt-6">Payment Pending</h1>
            <p className="mt-3 text-black/70">
              We haven't received confirmation for order{' '}
              <span className="font-mono">{state.order?.orderNumber}</span> yet.
              If you completed payment, it may take a moment to reflect.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link to="/account" className="px-8 py-3 rounded-full bg-ink text-white text-sm hover:bg-gold transition-colors">
                Check My Orders
              </Link>
              <Link to="/products" className="px-8 py-3 rounded-full border border-black/20 text-sm hover:border-gold hover:text-gold transition-colors">
                Back to Shop
              </Link>
            </div>
          </>
        )}

        {state.phase === 'error' && (
          <>
            <h1 className="font-display text-4xl">Something went wrong</h1>
            <p className="mt-3 text-black/70 text-sm">
              We couldn't confirm this payment. If you were charged, don't worry —
              check your orders or contact us and we'll sort it out.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link to="/account" className="px-8 py-3 rounded-full bg-ink text-white text-sm hover:bg-gold transition-colors">
                My Orders
              </Link>
              <Link to="/products" className="px-8 py-3 rounded-full border border-black/20 text-sm hover:border-gold hover:text-gold transition-colors">
                Back to Shop
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
