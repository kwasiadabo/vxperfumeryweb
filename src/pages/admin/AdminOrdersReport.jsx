import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { downloadBlob } from '../../lib/download';
import { money, formatDate } from '../../lib/format';

const toISODate = (d) => d.toLocaleDateString('en-CA');

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  pending_delivery: 'bg-blue-100 text-blue-800',
  dispatched: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function AdminOrdersReport() {
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.show);
  const navigate = useNavigate();
  const [from, setFrom] = useState(() => toISODate(new Date(Date.now() - 30 * 24 * 3600 * 1000)));
  const [to, setTo] = useState(() => toISODate(new Date()));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!user?.isAdmin) {
    navigate('/');
    return null;
  }

  const generate = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports/orders', { params: { from, to } });
      setReport(res.data);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to load report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const download = async () => {
    setDownloading(true);
    try {
      const res = await api.get('/admin/reports/orders.pdf', {
        params: { from, to },
        responseType: 'blob',
      });
      downloadBlob(res.data, `orders-report-${from}-to-${to}.pdf`);
      showToast('Report downloaded');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to generate report', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const inputClass = 'px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none focus:border-gold';

  return (
    <div className="w-full mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-display text-4xl">Orders Report</h1>
      <p className="mt-2 text-sm text-black/50">
        All orders received in the selected period, with the product price and delivery fee broken out separately,
        plus totals for each.
      </p>

      <div className="mt-8 bg-white border border-black/5 rounded-lg p-5 flex flex-wrap items-end gap-4">
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
          {loading ? 'Loading…' : 'Generate Report'}
        </button>
        {report && (
          <button
            onClick={download}
            disabled={downloading}
            className="px-6 py-2.5 rounded-full border border-ink text-ink text-sm hover:bg-ink hover:text-white transition-colors disabled:opacity-50"
          >
            {downloading ? 'Preparing PDF…' : 'Download PDF'}
          </button>
        )}
      </div>

      {report && (
        report.orders.length ? (
          <>
            <div className="mt-8 bg-white border border-black/5 rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-black/[0.03] text-left">
                  <tr>
                    <th className="px-3 py-3 font-medium">#</th>
                    <th className="px-3 py-3 font-medium">Order</th>
                    <th className="px-3 py-3 font-medium">Customer</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium text-right">Product (GHS)</th>
                    <th className="px-3 py-3 font-medium text-right">Delivery (GHS)</th>
                    <th className="px-3 py-3 font-medium text-right">Total (GHS)</th>
                  </tr>
                </thead>
                <tbody>
                  {report.orders.map((o, i) => (
                    <tr key={o.id} className="border-t border-black/5">
                      <td className="px-3 py-3 text-xs text-black/40">{i + 1}</td>
                      <td className="px-3 py-3">
                        <p className="font-mono text-xs">{o.orderNumber}</p>
                        <p className="text-xs text-black/40 mt-0.5">{formatDate(o.createdAt)}</p>
                      </td>
                      <td className="px-3 py-3 text-xs">{o.User?.firstName} {o.User?.lastName}</td>
                      <td className="px-3 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColors[o.status] || ''}`}>
                          {o.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right text-xs">{money(o.subtotal)}</td>
                      <td className="px-3 py-3 text-right text-xs">{money(o.shippingCost)}</td>
                      <td className="px-3 py-3 text-right text-xs font-medium">{money(o.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 bg-white border border-black/5 rounded-lg p-5 grid sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-black/40">Orders</p>
                <p className="mt-0.5 font-medium">{report.totals.orders}</p>
              </div>
              <div>
                <p className="text-black/40">Total Product Price</p>
                <p className="mt-0.5 font-medium">GHS {money(report.totals.totalProduct)}</p>
              </div>
              <div>
                <p className="text-black/40">Total Delivery Fees</p>
                <p className="mt-0.5 font-medium">GHS {money(report.totals.totalDelivery)}</p>
              </div>
              <div>
                <p className="text-black/40">Grand Total</p>
                <p className="mt-0.5 font-semibold text-gold">GHS {money(report.totals.grandTotal)}</p>
              </div>
            </div>
          </>
        ) : (
          <p className="mt-12 text-center text-black/40">No orders in this period.</p>
        )
      )}
    </div>
  );
}
