import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, Bike, Flag, Settings, FileBarChart2,
  Wallet, PackageSearch, IdCard, ChevronRight,
} from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

const BADGE_POLL_MS = 20000;

const MENU = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: Receipt, countKey: 'orders' },
  { to: '/admin/delivery', label: 'Delivery', icon: Bike },
  { to: '/admin/issues', label: 'Issues', icon: Flag, countKey: 'issues' },
];

// Polls a cheap count endpoint (not the full dashboard) and reports increases
// since the last check — used to badge and alert on new orders/issues.
function usePolledCount(url, enabled, onIncrease) {
  const [count, setCount] = useState(0);
  const previousRef = useRef(null); // null = baseline not yet fetched
  const onIncreaseRef = useRef(onIncrease);
  onIncreaseRef.current = onIncrease;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const poll = () => {
      api.get(url).then((res) => {
        if (cancelled) return;
        const next = res.data.count;
        setCount(next);
        if (previousRef.current !== null && next > previousRef.current) {
          onIncreaseRef.current(next - previousRef.current);
        }
        previousRef.current = next;
      }).catch(() => {});
    };
    poll();
    const interval = setInterval(poll, BADGE_POLL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [url, enabled]);

  return count;
}

const SETUP_MENU = [
  { to: '/admin/delivery-fees', label: 'Delivery Fees', icon: Wallet },
  { to: '/admin/products', label: 'Manage Products', icon: PackageSearch },
  { to: '/admin/riders', label: 'Riders', icon: IdCard },
];

const REPORTS_MENU = [
  { to: '/admin/reports/orders', label: 'Orders Report', icon: FileBarChart2 },
  { to: '/admin/reports/sales', label: 'Sales Report', icon: FileBarChart2 },
  { to: '/admin/reports/product-trend', label: 'Product Sales Trend', icon: FileBarChart2 },
  { to: '/admin/reports/rider-deliveries', label: 'Rider Deliveries', icon: FileBarChart2 },
];

const ACCORDIONS = [
  { key: 'setup', label: 'Setup', icon: Settings, items: SETUP_MENU },
  { key: 'reports', label: 'Reports', icon: FileBarChart2, items: REPORTS_MENU },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
    isActive ? 'bg-gold/20 text-gold-light font-medium' : 'text-white/60 hover:text-white hover:bg-white/5'
  }`;

export default function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore((s) => s.show);
  const navigate = useNavigate();
  const location = useLocation();
  const titleFlashRef = useRef(null);
  const originalTitleRef = useRef(document.title);

  const activeAccordions = ACCORDIONS.filter((acc) =>
    acc.items.some((item) => location.pathname.startsWith(item.to))
  ).map((acc) => acc.key);
  const [openAccordions, setOpenAccordions] = useState(new Set(activeAccordions));
  const toggleAccordion = (key) =>
    setOpenAccordions((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  useEffect(() => {
    if (!user?.isAdmin) navigate('/');
  }, [user, navigate]);

  const stopTitleFlash = () => {
    if (!titleFlashRef.current) return;
    clearInterval(titleFlashRef.current);
    titleFlashRef.current = null;
    document.title = originalTitleRef.current;
  };

  // New orders arriving while the admin has this tab in the background are easy
  // to miss — flash the tab title until they come back to check.
  const startTitleFlash = () => {
    if (titleFlashRef.current) return;
    let showAlert = true;
    titleFlashRef.current = setInterval(() => {
      document.title = showAlert ? '🔔 New order — VX Admin' : originalTitleRef.current;
      showAlert = !showAlert;
    }, 1000);
  };

  useEffect(() => {
    const onVisibilityChange = () => { if (!document.hidden) stopTitleFlash(); };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      stopTitleFlash();
    };
  }, []);

  const isAdmin = Boolean(user?.isAdmin);
  const counts = {
    orders: usePolledCount('/admin/orders/pending-count', isAdmin, (diff) => {
      toast(diff === 1 ? 'New order received!' : `${diff} new orders received!`, 'info');
      if (document.hidden) startTitleFlash();
    }),
    issues: usePolledCount('/admin/issues/open-count', isAdmin, (diff) => {
      toast(diff === 1 ? 'New issue reported!' : `${diff} new issues reported!`, 'info');
      if (document.hidden) startTitleFlash();
    }),
  };

  // keep an accordion open while browsing its pages
  useEffect(() => {
    if (activeAccordions.length) {
      setOpenAccordions((prev) => new Set([...prev, ...activeAccordions]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (!user?.isAdmin) return null;

  return (
    <div className="flex-1 flex flex-col md:flex-row">
      <aside className="md:w-56 shrink-0 bg-ink md:min-h-full">
        <div className="md:sticky md:top-16 p-4">
          <p className="hidden md:block px-4 pb-3 text-[10px] uppercase tracking-[0.25em] text-white/30">
            Admin Portal
          </p>
          <nav className="flex md:flex-col gap-1 overflow-x-auto">
            {MENU.map((item) => {
              const badgeCount = item.countKey ? counts[item.countKey] : 0;
              return (
                <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                  <item.icon size={17} strokeWidth={1.75} className="shrink-0" />
                  <span className="whitespace-nowrap flex-1">{item.label}</span>
                  {badgeCount > 0 && (
                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-gold text-ink text-[11px] font-semibold flex items-center justify-center">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </NavLink>
              );
            })}

            {/* Accordion groups (Setup, Reports, ...) */}
            {ACCORDIONS.map((acc) => {
              const isOpen = openAccordions.has(acc.key);
              const isActive = activeAccordions.includes(acc.key);
              return (
                <div key={acc.key}>
                  <button
                    type="button"
                    onClick={() => toggleAccordion(acc.key)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors text-left ${
                      isActive ? 'text-gold-light' : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <acc.icon size={17} strokeWidth={1.75} className="shrink-0" />
                    <span className="whitespace-nowrap flex-1">{acc.label}</span>
                    <ChevronRight
                      size={14}
                      strokeWidth={2}
                      className={`hidden md:inline transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                    />
                  </button>
                  <div
                    className={`flex md:flex-col gap-1 md:overflow-hidden md:transition-all md:duration-200 ${
                      isOpen ? 'md:max-h-40 md:opacity-100' : 'md:max-h-0 md:opacity-0 hidden md:flex'
                    }`}
                  >
                    {acc.items.map((item) => (
                      <NavLink key={item.to} to={item.to} className={linkClass}>
                        <span className="hidden md:inline w-4"></span>
                        <item.icon size={17} strokeWidth={1.75} className="shrink-0" />
                        <span className="whitespace-nowrap">{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
}
