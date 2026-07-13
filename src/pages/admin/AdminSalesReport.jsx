import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileDown } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { downloadBlob } from '../../lib/download';
import { money, formatDate } from '../../lib/format';
import RevenueTrendChart from '../../components/RevenueTrendChart';

const toISODate = (d) => d.toLocaleDateString('en-CA');

export default function AdminSalesReport() {
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore((s) => s.show);
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
      const res = await api.get('/admin/reports/sales', { params: { from, to } });
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
      const res = await api.get('/admin/reports/sales.pdf', { params: { from, to }, responseType: 'blob' });
      downloadBlob(res.data, `sales-report-${from}-to-${to}.pdf`);
      toast('Report downloaded');
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to generate report', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const inputClass = 'px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none focus:border-gold';

  return (
    <div className="w-full mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-display text-4xl">Sales Report</h1>
      <p className="mt-2 text-sm text-black/50">
        Daily sales and the revenue trend over a selected period.
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
          <div className="mt-4 bg-white border border-black/5 rounded-lg p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-black/40">Total Orders</p>
              <p className="mt-0.5 font-medium">{report.totals.totalOrders}</p>
            </div>
            <div>
              <p className="text-black/40">Avg Daily Revenue</p>
              <p className="mt-0.5 font-medium">GHS {money(report.totals.averageDailyRevenue)}</p>
            </div>
            <div>
              <p className="text-black/40">Avg Order Value</p>
              <p className="mt-0.5 font-medium">GHS {money(report.totals.averageOrderValue)}</p>
            </div>
            <div>
              <p className="text-black/40">Total Revenue</p>
              <p className="mt-0.5 font-semibold text-gold">GHS {money(report.totals.totalRevenue)}</p>
            </div>
          </div>

          <div className="mt-4 bg-white border border-black/5 rounded-lg p-5">
            <p className="text-xs uppercase tracking-widest text-black/40 mb-4">Sales Trend</p>
            <RevenueTrendChart data={report.daily} />
          </div>

          <div className="mt-4 bg-white border border-black/5 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/[0.03] text-left">
                <tr>
                  <th className="px-3 py-3 font-medium">#</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium text-right">Orders</th>
                  <th className="px-3 py-3 font-medium text-right">Revenue (GHS)</th>
                </tr>
              </thead>
              <tbody>
                {report.daily.filter((d) => d.orders > 0).map((d, i) => (
                  <tr key={d.day} className="border-t border-black/5">
                    <td className="px-3 py-3 text-xs text-black/40">{i + 1}</td>
                    <td className="px-3 py-3 text-xs">{formatDate(d.day)}</td>
                    <td className="px-3 py-3 text-right text-xs">{d.orders}</td>
                    <td className="px-3 py-3 text-right text-xs font-medium">{money(d.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {report.totals.totalOrders === 0 && (
              <p className="px-3 py-6 text-center text-sm text-black/40">No sales in this period.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
