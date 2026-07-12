import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { confirmDialog } from '../../store/dialogStore';
import { GHANA_REGIONS } from '../../lib/regions';

export default function AdminDeliveryFees() {
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore((s) => s.show);
  const navigate = useNavigate();
  const [fees, setFees] = useState([]);
  const [form, setForm] = useState({ region: '', city: '', fee: '' });
  const [busy, setBusy] = useState(null);

  const load = () => api.get('/delivery-fees').then((res) => setFees(res.data)).catch(() => {});

  useEffect(() => {
    if (!user?.isAdmin) return navigate('/');
    load();
  }, [user, navigate]);

  if (!user?.isAdmin) return null;

  const setFee = (id, value) =>
    setFees(fees.map((f) => (f.id === id ? { ...f, fee: value } : f)));

  const save = async (row) => {
    setBusy(row.id);
    try {
      await api.put('/admin/delivery-fees', { region: row.region, city: row.city, fee: Number(row.fee) });
      toast(`${row.city}, ${row.region} fee saved`);
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to save fee', 'error');
    } finally {
      setBusy(null);
    }
  };

  const remove = async (row) => {
    const ok = await confirmDialog({
      title: 'Remove Fee',
      message: `Remove the fee for ${row.city}, ${row.region}?`,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (!ok) return;
    setBusy(row.id);
    try {
      await api.delete(`/admin/delivery-fees/${row.id}`);
      toast(`${row.city} removed`);
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to remove fee', 'error');
    } finally {
      setBusy(null);
    }
  };

  const addCity = async (e) => {
    e.preventDefault();
    try {
      await api.put('/admin/delivery-fees', { region: form.region, city: form.city, fee: Number(form.fee) });
      toast(`${form.city}, ${form.region} added`);
      setForm({ region: '', city: '', fee: '' });
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to add city fee', 'error');
    }
  };

  // group fees by region, 'Other' fallback listed last within each region
  const grouped = GHANA_REGIONS
    .map((region) => ({
      region,
      rows: fees
        .filter((f) => f.region === region)
        .sort((a, b) => (a.city === 'Other') - (b.city === 'Other') || a.city.localeCompare(b.city)),
    }))
    .filter((g) => g.rows.length);

  const inputClass = 'px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none focus:border-gold';
  const labelClass = 'flex flex-col gap-1 text-xs font-medium text-black/60';

  return (
    <div className="w-full mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl">Delivery Fees</h1>
      <p className="text-sm text-black/40 mt-2">
        Fees are set per city or town within each region. "Other" is the fallback fee
        for locations in the region without their own rate.
      </p>

      <form onSubmit={addCity} className="mt-6 flex flex-wrap items-end gap-3">
        <label className={labelClass}>Region *
          <select required value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className={inputClass}>
            <option value="">— Select region —</option>
            {GHANA_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className={labelClass}>City or town *
          <input required value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })} className={`${inputClass} w-44`} />
        </label>
        <label className={labelClass}>Fee (GHS) *
          <input required type="number" min="0" step="0.01" value={form.fee}
            onChange={(e) => setForm({ ...form, fee: e.target.value })} className={`${inputClass} w-32`} />
        </label>
        <button type="submit" className="px-6 py-2 rounded-full bg-ink text-white text-sm hover:bg-gold transition-colors">
          Add City Fee
        </button>
      </form>

      <div className="mt-8 space-y-6">
        {grouped.map(({ region, rows }) => (
          <div key={region} className="bg-white border border-black/5 rounded-lg overflow-hidden">
            <p className="px-4 py-3 bg-black/[0.03] text-xs uppercase tracking-[0.2em] text-gold">{region}</p>
            <table className="w-full text-sm">
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-black/5">
                    <td className="px-4 py-2.5">
                      {row.city === 'Other' ? <span className="text-black/50 italic">Other areas</span> : row.city}
                    </td>
                    <td className="px-4 py-2.5 w-40">
                      <input
                        type="number" min="0" step="0.01" value={row.fee}
                        onChange={(e) => setFee(row.id, e.target.value)}
                        className="w-28 px-3 py-1.5 border border-black/15 rounded bg-white text-sm focus:outline-none focus:border-gold"
                      />
                    </td>
                    <td className="px-4 py-2.5 w-44 text-right whitespace-nowrap">
                      <button
                        onClick={() => save(row)}
                        disabled={busy === row.id}
                        className="text-xs px-4 py-1.5 rounded-full bg-ink text-white hover:bg-gold transition-colors disabled:opacity-40"
                      >
                        Save
                      </button>
                      {row.city !== 'Other' && (
                        <button
                          onClick={() => remove(row)}
                          disabled={busy === row.id}
                          className="ml-2 text-xs px-3 py-1.5 rounded-full border border-black/15 text-black/40 hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-40"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
