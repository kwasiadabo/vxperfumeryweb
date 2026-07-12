import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useToastStore } from '../../store/toastStore';
import { confirmDialog } from '../../store/dialogStore';

export default function AdminRiders() {
  const toast = useToastStore((s) => s.show);
  const [riders, setRiders] = useState([]);
  const [form, setForm] = useState({ name: '', phoneNumber: '' });
  const [busy, setBusy] = useState(null);
  const [pinNotice, setPinNotice] = useState(null); // { name, pin, smsSent }

  const load = () => api.get('/admin/delivery-persons').then((res) => setRiders(res.data)).catch(() => {});

  useEffect(() => { load(); }, []);

  const addRider = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/admin/delivery-persons', form);
      setForm({ name: '', phoneNumber: '' });
      setPinNotice({ name: data.name, pin: data.pin, smsSent: data.smsSent });
      toast(`${data.name} added to the delivery team`);
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to add rider', 'error');
    }
  };

  const resetPin = async (rider) => {
    const ok = await confirmDialog({
      title: `Reset PIN?`,
      message: `Reset ${rider.name}'s PIN? They'll receive the new PIN by SMS and will need to set a new password.`,
      confirmLabel: 'Reset PIN',
      danger: true,
    });
    if (!ok) return;
    setBusy(rider.id);
    try {
      const { data } = await api.post(`/admin/delivery-persons/${rider.id}/reset-pin`);
      setPinNotice({ name: data.name, pin: data.pin, smsSent: data.smsSent });
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to reset PIN', 'error');
    } finally {
      setBusy(null);
    }
  };

  const toggleActive = async (rider) => {
    setBusy(rider.id);
    try {
      await api.patch(`/admin/delivery-persons/${rider.id}`, { isActive: !rider.isActive });
      toast(`${rider.name} ${rider.isActive ? 'deactivated' : 'reactivated'}`);
      load();
    } catch {
      toast('Failed to update rider', 'error');
    } finally {
      setBusy(null);
    }
  };

  const inputClass = 'px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none focus:border-gold';
  const labelClass = 'flex flex-col gap-1 text-xs font-medium text-black/60';

  return (
    <div className="w-full mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-4xl">Delivery Riders</h1>
      <p className="text-sm text-black/40 mt-2">
        New riders receive a 6-digit login PIN by SMS for the Rider Portal. After their first sign-in they're
        required to set a password, which replaces the PIN for all logins after that.
      </p>

      <form onSubmit={addRider} className="mt-6 flex flex-wrap items-end gap-3">
        <label className={labelClass}>Full name *
          <input required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
        </label>
        <label className={labelClass}>Phone number * (e.g. 233241234567)
          <input required value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} className={inputClass} />
        </label>
        <button type="submit" className="px-6 py-2 rounded-full bg-ink text-white text-sm hover:bg-gold transition-colors">
          Add Rider
        </button>
      </form>

      {pinNotice && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm bg-gold/10 border border-gold/30 rounded-lg px-4 py-3">
          <p>
            {pinNotice.name}'s PIN: <strong className="font-mono text-base">{pinNotice.pin}</strong>
            {' '}— {pinNotice.smsSent
              ? 'sent to them by SMS.'
              : <span className="text-red-600">SMS failed — share this PIN with them directly.</span>}
            {' '}It is shown only once.
          </p>
          <button onClick={() => setPinNotice(null)} className="text-black/40 hover:text-black text-xs">Dismiss</button>
        </div>
      )}

      <div className="mt-8 bg-white border border-black/5 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-black/[0.03] text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Rider</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">PIN</th>
              <th className="px-4 py-3 font-medium">Password</th>
              <th className="px-4 py-3 font-medium">Active Deliveries</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {riders.map((rider) => (
              <tr key={rider.id} className={`border-t border-black/5 ${rider.isActive ? '' : 'opacity-50'}`}>
                <td className="px-4 py-3">{rider.name}</td>
                <td className="px-4 py-3">{rider.phoneNumber}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${rider.hasPin ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {rider.hasPin ? 'Set' : 'Not set'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${rider.hasPassword ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {rider.hasPassword ? 'Set' : 'Pending setup'}
                  </span>
                </td>
                <td className="px-4 py-3">{rider.activeDeliveries}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${rider.isActive ? 'bg-green-100 text-green-800' : 'bg-black/10 text-black/50'}`}>
                    {rider.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => resetPin(rider)}
                    disabled={busy === rider.id}
                    className="text-xs px-4 py-1.5 rounded-full border border-black/15 hover:border-gold hover:text-gold transition-colors disabled:opacity-40"
                  >
                    {rider.hasPin ? 'Reset PIN' : 'Issue PIN'}
                  </button>
                  <button
                    onClick={() => toggleActive(rider)}
                    disabled={busy === rider.id}
                    className="ml-2 text-xs px-4 py-1.5 rounded-full border border-black/15 text-black/40 hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-40"
                  >
                    {rider.isActive ? 'Deactivate' : 'Reactivate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
