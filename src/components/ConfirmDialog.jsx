import { useEffect, useRef } from 'react';
import { TriangleAlert } from 'lucide-react';
import { useDialogStore } from '../store/dialogStore';

export default function ConfirmDialog() {
  const request = useDialogStore((s) => s.request);
  const resolve = useDialogStore((s) => s.resolve);
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!request) return;
    confirmRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === 'Escape') resolve(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [request, resolve]);

  if (!request) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-ink/60 backdrop-blur-sm animate-[dialog-backdrop-in_0.15s_ease-out]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) resolve(false); }}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="w-full max-w-sm bg-cream rounded-xl border border-black/10 shadow-2xl p-6 animate-[dialog-in_0.2s_ease-out]"
      >
        <div className="flex items-start gap-3">
          {request.danger && (
            <span className="mt-0.5 shrink-0 w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <TriangleAlert size={18} strokeWidth={1.75} />
            </span>
          )}
          <div>
            <h2 id="confirm-dialog-title" className="font-display text-xl text-ink">{request.title}</h2>
            <p id="confirm-dialog-message" className="mt-1.5 text-sm text-black/60 whitespace-pre-line">
              {request.message}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => resolve(false)}
            className="px-5 py-2.5 rounded-full text-sm border border-black/15 text-black/60 hover:bg-black/5 transition-colors"
          >
            {request.cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => resolve(true)}
            className={`px-5 py-2.5 rounded-full text-sm text-white transition-colors ${
              request.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-ink hover:bg-gold'
            }`}
          >
            {request.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
