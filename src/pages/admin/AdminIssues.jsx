import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { formatDate } from '../../lib/format';

const CATEGORY_LABELS = {
  non_delivery: 'Non-delivery',
  bad_product: 'Bad product',
  wrong_item: 'Wrong item',
  damaged: 'Damaged item',
  other: 'Other',
};

const STATUSES = ['open', 'in_progress', 'resolved'];

const badge = {
  open: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
};

export default function AdminIssues() {
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.show);
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({}); // issueId -> response text being composed
  const [saving, setSaving] = useState(null);

  const load = () => {
    setLoading(true);
    const params = {};
    if (filter) params.status = filter;
    api.get('/admin/issues', { params })
      .then((res) => setIssues(res.data))
      .catch(() => setIssues([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user?.isAdmin) return navigate('/');
    load();
  }, [user, navigate, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user?.isAdmin) return null;

  const respond = async (issue, status) => {
    setSaving(issue.id);
    try {
      await api.patch(`/admin/issues/${issue.id}`, {
        response: drafts[issue.id] ?? undefined,
        status,
      });
      setDrafts((d) => ({ ...d, [issue.id]: '' }));
      showToast('Issue updated');
      load();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update issue', 'error');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="w-full mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl">Issues</h1>
        <label className="flex flex-col gap-1 text-xs font-medium text-black/60">Status
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="mt-12 text-center text-black/40">Loading issues…</p>
      ) : issues.length ? (
        <div className="mt-8 space-y-4">
          {issues.map((issue) => (
            <div key={issue.id} className="bg-white border border-black/5 rounded-lg p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-sm font-medium">{CATEGORY_LABELS[issue.category] || issue.category}</span>
                  {issue.Order?.orderNumber && (
                    <span className="ml-2 text-xs font-mono text-black/40">Order {issue.Order.orderNumber}</span>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full capitalize ${badge[issue.status] || ''}`}>
                  {issue.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-black/40 mt-1">
                {issue.User?.firstName} {issue.User?.lastName} · {issue.User?.phoneNumber || issue.User?.email} · {formatDate(issue.createdAt)}
              </p>
              <p className="mt-2 text-sm text-black/70">{issue.description}</p>

              {issue.adminResponse && (
                <div className="mt-3 pl-3 border-l-2 border-gold">
                  <p className="text-xs uppercase tracking-[0.2em] text-gold">Our Response</p>
                  <p className="mt-1 text-sm text-black/70">{issue.adminResponse}</p>
                </div>
              )}

              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <textarea
                  rows={2}
                  value={drafts[issue.id] ?? ''}
                  onChange={(e) => setDrafts((d) => ({ ...d, [issue.id]: e.target.value }))}
                  placeholder="Write a response…"
                  className="flex-1 px-3 py-2 border border-black/15 rounded-lg bg-white text-sm focus:outline-none focus:border-gold"
                />
                <div className="flex sm:flex-col gap-2">
                  <button
                    disabled={saving === issue.id}
                    onClick={() => respond(issue, 'resolved')}
                    className="px-4 py-2 rounded-full bg-ink text-white text-xs hover:bg-gold transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    Send &amp; resolve
                  </button>
                  <select
                    value={issue.status}
                    disabled={saving === issue.id}
                    onChange={(e) => respond(issue, e.target.value)}
                    className="px-3 py-2 rounded-full border border-black/15 bg-white text-xs disabled:opacity-40"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-12 text-center text-black/40">
          No issues{filter ? ` with status "${filter.replace(/_/g, ' ')}"` : ''}.
        </p>
      )}
    </div>
  );
}
