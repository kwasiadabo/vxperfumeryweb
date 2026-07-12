import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileDown } from 'lucide-react';
import riderApi from '../lib/riderApi';
import { money, formatDate } from '../lib/format';
import { useRiderAuthStore } from '../store/riderAuthStore';
import { useToastStore } from '../store/toastStore';
import { downloadBlob } from '../lib/download';

const toISODate = (d) => d.toLocaleDateString('en-CA');

const statusColors = {
  pending_delivery: 'bg-blue-100 text-blue-800',
  dispatched: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const TABS = [
  { key: 'assigned', label: 'Orders Assigned' },
  { key: 'delivered', label: 'Deliveries Completed' },
];

export default function RiderReport() {
  const rider = useRiderAuthStore((s) => s.rider);
  const toast = useToastStore((s) => s.show);
  const navigate = useNavigate();
  const [from, setFrom] = useState(() => toISODate(new Date(Date.now() - 30 * 24 * 3600 * 1000)));
  const [to, setTo] = useState(() => toISODate(new Date()));
  const [report, setReport] = useState(null);
  const [tab, setTab] = useState('assigned');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!rider) {
    navigate('/rider');
    return null;
  }

  const generate = async () => {
    setLoading(true);
    try {
      const res = await riderApi.get('/rider/report', { params: { from, to } });
      setReport(res.data);
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to load report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const download = async () => {
    setDownloading(true);
    try {
      const res = await riderApi.get('/rider/report.pdf', { params: { from, to }, responseType: 'blob' });
      downloadBlob(res.data, `my-report-${from}-to-${to}.pdf`);
      toast('Report downloaded');
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to generate report', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const inputClass = 'px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none focus:border-gold';
  const tabClass = (active) =>
    `px-1 pb-3 text-sm border-b-2 transition-colors ${
      active ? 'border-gold text-ink font-medium' : 'border-transparent text-black/40 hover:text-black/70'
    }`;

  return (
    <div className="w-full mx-auto max-w-4xl px-4 py-12">
      <Link to="/rider" className="inline-flex items-center gap-1.5 text-sm text-black/50 hover:text-gold">
        <ArrowLeft size={15} strokeWidth={2} /> Back to Deliveries
      </Link>

      <h1 className="font-display text-4xl mt-4">My Report</h1>
      <p className="mt-2 text-sm text-black/50">
        Orders assigned to you and deliveries you've completed in a selected period.
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
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-full border border-ink text-ink text-sm hover:bg-ink hover:text-white transition-colors disabled:opacity-50"
          >
            <FileDown size={16} strokeWidth={2} /> {downloading ? 'Preparing PDF…' : 'Download PDF'}
          </button>
        )}
      </div>

      {report && (
        <>
          <div className="mt-4 bg-white border border-black/5 rounded-lg p-5 grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-black/40">Orders Assigned</p>
              <p className="mt-0.5 font-medium">{report.totals.assignedCount}</p>
            </div>
            <div>
              <p className="text-black/40">Deliveries Completed</p>
              <p className="mt-0.5 font-medium">{report.totals.deliveredCount}</p>
            </div>
            <div>
              <p className="text-black/40">Total Delivery Fees</p>
              <p className="mt-0.5 font-semibold text-gold">GHS {money(report.totals.deliveredFees)}</p>
            </div>
          </div>

          <div className="mt-8 flex gap-6 border-b border-black/10">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} className={tabClass(tab === t.key)}>
                {t.label} ({t.key === 'assigned' ? report.assigned.length : report.delivered.length})
              </button>
            ))}
          </div>

          {tab === 'assigned' && (
            report.assigned.length ? (
              <div className="mt-4 bg-white border border-black/5 rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-black/[0.03] text-left">
                    <tr>
                      <th className="px-3 py-3 font-medium">#</th>
                      <th className="px-3 py-3 font-medium">Order</th>
                      <th className="px-3 py-3 font-medium">Customer</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium">Delivery Description</th>
                      <th className="px-3 py-3 font-medium text-right">Item (GHS)</th>
                      <th className="px-3 py-3 font-medium text-right">Delivery Fee (GHS)</th>
                      <th className="px-3 py-3 font-medium text-right">Total (GHS)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.assigned.map((o, i) => (
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
                        <td className="px-3 py-3 text-xs text-black/60 max-w-[220px]">{o.shippingAddress || '—'}</td>
                        <td className="px-3 py-3 text-right text-xs">{money(o.subtotal)}</td>
                        <td className="px-3 py-3 text-right text-xs">{money(o.shippingCost)}</td>
                        <td className="px-3 py-3 text-right text-xs font-medium">{money(o.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-black/40 text-sm">No orders assigned to you in this period.</p>
            )
          )}

          {tab === 'delivered' && (
            report.delivered.length ? (
              <div className="mt-4 bg-white border border-black/5 rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-black/[0.03] text-left">
                    <tr>
                      <th className="px-3 py-3 font-medium">#</th>
                      <th className="px-3 py-3 font-medium">Order</th>
                      <th className="px-3 py-3 font-medium">Customer</th>
                      <th className="px-3 py-3 font-medium">Delivered</th>
                      <th className="px-3 py-3 font-medium">Delivery Description</th>
                      <th className="px-3 py-3 font-medium text-right">Item (GHS)</th>
                      <th className="px-3 py-3 font-medium text-right">Delivery Fee (GHS)</th>
                      <th className="px-3 py-3 font-medium text-right">Total (GHS)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.delivered.map((o, i) => (
                      <tr key={o.id} className="border-t border-black/5">
                        <td className="px-3 py-3 text-xs text-black/40">{i + 1}</td>
                        <td className="px-3 py-3 font-mono text-xs">{o.orderNumber}</td>
                        <td className="px-3 py-3 text-xs">{o.User?.firstName} {o.User?.lastName}</td>
                        <td className="px-3 py-3 text-xs">{formatDate(o.deliveredAt)}</td>
                        <td className="px-3 py-3 text-xs text-black/60 max-w-[220px]">{o.shippingAddress || '—'}</td>
                        <td className="px-3 py-3 text-right text-xs">{money(o.subtotal)}</td>
                        <td className="px-3 py-3 text-right text-xs">{money(o.shippingCost)}</td>
                        <td className="px-3 py-3 text-right text-xs font-medium">{money(o.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-black/40 text-sm">No deliveries completed in this period.</p>
            )
          )}
        </>
      )}
    </div>
  );
}
