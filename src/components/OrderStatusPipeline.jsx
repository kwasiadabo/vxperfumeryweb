const STATUSES = [
  { key: 'pending', label: 'Pending', color: 'bg-yellow-400' },
  { key: 'pending_delivery', label: 'Awaiting Dispatch', color: 'bg-blue-400' },
  { key: 'dispatched', label: 'Out for Delivery', color: 'bg-orange-400' },
  { key: 'delivered', label: 'Delivered', color: 'bg-green-500' },
  { key: 'cancelled', label: 'Cancelled', color: 'bg-red-400' },
];

export default function OrderStatusPipeline({ byStatus }) {
  const total = STATUSES.reduce((sum, s) => sum + (byStatus[s.key] || 0), 0);

  return (
    <div>
      <div className="flex h-7 rounded-full overflow-hidden bg-black/5">
        {total === 0 ? null : STATUSES.map((s) => {
          const count = byStatus[s.key] || 0;
          if (!count) return null;
          const pct = (count / total) * 100;
          return (
            <div
              key={s.key}
              className={`${s.color} h-full`}
              style={{ width: `${pct}%` }}
              title={`${s.label}: ${count}`}
            />
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs">
        {STATUSES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-black/60">
            <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
            {s.label} <span className="font-medium text-black">{byStatus[s.key] || 0}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
