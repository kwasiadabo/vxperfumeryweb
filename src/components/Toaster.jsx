import { Check, CircleAlert, Info } from 'lucide-react';
import { useToastStore } from '../store/toastStore';

const ICONS = {
  success: <Check size={15} strokeWidth={2.5} className="text-gold-light" />,
  error: <CircleAlert size={15} strokeWidth={2} className="text-red-400" />,
  info: <Info size={15} strokeWidth={2} className="text-white/70" />,
};

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.type === 'error' ? 'alert' : 'status'}
          className="px-5 py-3 rounded-full bg-ink text-white text-sm shadow-lg flex items-center gap-2 animate-[toast-in_0.25s_ease-out]"
        >
          {ICONS[toast.type] || ICONS.success}
          {toast.message}
        </div>
      ))}
    </div>
  );
}
