import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { formatDate } from '../lib/format';

const CATEGORIES = [
  { value: 'non_delivery', label: 'Non-delivery' },
  { value: 'bad_product', label: 'Bad product' },
  { value: 'wrong_item', label: 'Wrong item' },
  { value: 'damaged', label: 'Damaged item' },
  { value: 'other', label: 'Other' },
];

const statusColors = {
  open: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
};

export default function ReportIssue() {
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.show);
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [issues, setIssues] = useState([]);
  const [form, setForm] = useState({ category: '', orderId: '', description: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadIssues = () => api.get('/issues').then((res) => setIssues(res.data)).catch(() => {});

  useEffect(() => {
    if (!user) return navigate('/login');
    api.get('/orders').then((res) => setOrders(res.data)).catch(() => {});
    loadIssues();
  }, [user, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.category) return setError('Please select an issue type');
    if (!form.description.trim()) return setError('Please describe the issue');
    setSubmitting(true);
    try {
      await api.post('/issues', {
        category: form.category,
        description: form.description.trim(),
        orderId: form.orderId || undefined,
      });
      setForm({ category: '', orderId: '', description: '' });
      showToast('Issue reported — we’ll get back to you soon');
      loadIssues();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 border border-black/15 rounded-lg bg-white text-sm focus:outline-none focus:border-gold';
  const labelClass = 'flex flex-col gap-1 text-xs font-medium text-black/60';

  return (
    <div className="w-full mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl">Report an Issue</h1>
      <p className="mt-2 text-sm text-black/50">
        Let us know if something went wrong with an order — non-delivery, a damaged or wrong item, or anything
        else — and our team will follow up with you.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-3 bg-white border border-black/5 rounded-lg p-5">
        <label className={labelClass}>Issue type *
          <select required value={form.category} onChange={set('category')} className={inputClass}>
            <option value="">Select an issue type…</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        <label className={labelClass}>Related order (optional)
          <select value={form.orderId} onChange={set('orderId')} className={inputClass}>
            <option value="">Not related to a specific order</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>{o.orderNumber} · {formatDate(o.createdAt)}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>Description *
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={set('description')}
            placeholder="Tell us what happened…"
            className={inputClass}
          />
        </label>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-full bg-ink text-white text-sm hover:bg-gold transition-colors disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit Report'}
        </button>
      </form>

      <h2 className="font-display text-2xl mt-10">My Reported Issues</h2>
      {issues.length ? (
        <div className="mt-4 space-y-3">
          {issues.map((issue) => (
            <div key={issue.id} className="bg-white border border-black/5 rounded-lg p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium capitalize">
                  {CATEGORIES.find((c) => c.value === issue.category)?.label || issue.category}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColors[issue.status] || ''}`}>
                  {issue.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-black/40 mt-1">
                {formatDate(issue.createdAt)}
                {issue.Order?.orderNumber && ` · Order ${issue.Order.orderNumber}`}
              </p>
              <p className="mt-2 text-sm text-black/70">{issue.description}</p>
              {issue.adminResponse && (
                <div className="mt-3 pl-3 border-l-2 border-gold">
                  <p className="text-xs uppercase tracking-[0.2em] text-gold">Our Response</p>
                  <p className="mt-1 text-sm text-black/70">{issue.adminResponse}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-black/40 text-sm">No issues reported yet.</p>
      )}
    </div>
  );
}
