import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, Bike, Flag, Settings, FileBarChart2,
  Wallet, PackageSearch, IdCard, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const MENU = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: Receipt },
  { to: '/admin/delivery', label: 'Delivery', icon: Bike },
  { to: '/admin/issues', label: 'Issues', icon: Flag },
];

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
  const navigate = useNavigate();
  const location = useLocation();

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
            {MENU.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                <item.icon size={17} strokeWidth={1.75} className="shrink-0" />
                <span className="whitespace-nowrap">{item.label}</span>
              </NavLink>
            ))}

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
