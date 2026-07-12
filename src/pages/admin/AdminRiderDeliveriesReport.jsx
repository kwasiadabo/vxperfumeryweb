import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bike } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { downloadBlob } from '../../lib/download';
import { money, formatDate } from '../../lib/format';

const toISODate = (d) => d.toLocaleDateString('en-CA');

export default function AdminRiderDeliveriesReport() {
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
      const res = await api.get('/admin/reports/rider-deliveries', { params: { from, to } });
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
      const res = await api.get('/admin/reports/rider-deliveries.pdf', {
        params: { from, to },
        responseType: 'blob',
      });
      downloadBlob(res.data, `rider-deliveries-report-${from}-to-${to}.pdf`);
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
      <h1 className="font-display text-4xl">Rider Deliveries Report</h1>
      <p className="mt-2 text-sm text-black/50">
        Deliveries completed by each rider in the selected period, with the amount involved per delivery and
        totals per rider.
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
        report.riderGroups.length ? (
          <>
            <div className="mt-8 space-y-6">
              {report.riderGroups.map((group) => {
                const riderTotal = group.orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
                return (
                  <div key={group.rider.id} className="bg-white border border-black/5 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-black/[0.03] flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm flex items-center gap-1.5">
                          <Bike size={15} strokeWidth={2} className="shrink-0" /> {group.rider.name}
                        </p>
                        <p className="text-xs text-black/40">{group.rider.phoneNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-black/40">{group.orders.length} deliveries</p>
                        <p className="text-sm font-semibold text-gold">GHS {money(riderTotal)}</p>
                      </div>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="text-left">
                        <tr>
                          <th className="px-3 py-2 font-medium text-xs text-black/50">#</th>
                          <th className="px-3 py-2 font-medium text-xs text-black/50">Order</th>
                          <th className="px-3 py-2 font-medium text-xs text-black/50">Customer</th>
                          <th className="px-3 py-2 font-medium text-xs text-black/50">Delivered</th>
                          <th className="px-3 py-2 font-medium text-xs text-black/50 text-right">Product (GHS)</th>
                          <th className="px-3 py-2 font-medium text-xs text-black/50 text-right">Delivery (GHS)</th>
                          <th className="px-3 py-2 font-medium text-xs text-black/50 text-right">Total (GHS)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.orders.map((o, i) => (
                          <tr key={o.id} className="border-t border-black/5">
                            <td className="px-3 py-2 text-xs text-black/40">{i + 1}</td>
                            <td className="px-3 py-2 font-mono text-xs">{o.orderNumber}</td>
                            <td className="px-3 py-2 text-xs">{o.User?.firstName} {o.User?.lastName}</td>
                            <td className="px-3 py-2 text-xs">{formatDate(o.deliveredAt)}</td>
                            <td className="px-3 py-2 text-right text-xs">{money(o.subtotal)}</td>
                            <td className="px-3 py-2 text-right text-xs">{money(o.shippingCost)}</td>
                            <td className="px-3 py-2 text-right text-xs font-medium">{money(o.totalAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 bg-white border border-black/5 rounded-lg p-5 grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-black/40">Riders</p>
                <p className="mt-0.5 font-medium">{report.totals.riders}</p>
              </div>
              <div>
                <p className="text-black/40">Total Deliveries</p>
                <p className="mt-0.5 font-medium">{report.totals.deliveries}</p>
              </div>
              <div>
                <p className="text-black/40">Grand Total Amount</p>
                <p className="mt-0.5 font-semibold text-gold">GHS {money(report.totals.grandTotal)}</p>
              </div>
            </div>
          </>
        ) : (
          <p className="mt-12 text-center text-black/40">No deliveries in this period.</p>
        )
      )}
    </div>
  );
}
