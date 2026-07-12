import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useRiderAuthStore } from '../store/riderAuthStore';

const navLinkClass = ({ isActive }) =>
  `text-sm tracking-wide transition-colors ${isActive ? 'text-gold' : 'text-black/60 hover:text-black'}`;

const mobileNavLinkClass = ({ isActive }) =>
  `block px-4 py-3 text-base tracking-wide transition-colors ${isActive ? 'text-gold' : 'text-black/70 hover:text-black'}`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const count = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const rider = useRiderAuthStore((s) => s.rider);
  const riderLogout = useRiderAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const signOut = () => {
    if (user) logout();
    if (rider) riderLogout();
    setOpen(false);
    navigate('/');
  };

  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur border-b border-black/10">
      <div className="w-full mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <Link to="/" onClick={closeMenu} className="font-display text-2xl tracking-widest">
          VX <span className="text-gold">PERFUMERY</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-6">
          <NavLink to="/products" className={navLinkClass}>Shop</NavLink>
          <NavLink to="/favorites" className={navLinkClass}>Favourites</NavLink>
          {user && (
            <NavLink to="/cart" className={navLinkClass}>
              Cart{count > 0 && <span className="ml-1 text-gold">({count})</span>}
            </NavLink>
          )}
          {user && (
            <NavLink to="/report-issue" className={navLinkClass}>Report Issue</NavLink>
          )}
          {user ? (
            <NavLink to="/account" className={navLinkClass}>{user.firstName}</NavLink>
          ) : rider ? (
            <NavLink to="/rider" className={navLinkClass}>{rider.name}</NavLink>
          ) : (
            <NavLink to="/login" className={navLinkClass}>Sign in</NavLink>
          )}
          {user?.isAdmin && <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>}
          {(user || rider) && (
            <button
              onClick={signOut}
              className="text-sm tracking-wide text-black/40 hover:text-red-500 transition-colors"
            >
              Sign out
            </button>
          )}
        </nav>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="lg:hidden -mr-2 flex h-11 w-11 items-center justify-center text-ink"
        >
          {open ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile nav panel */}
      {open && (
        <nav
          id="mobile-nav"
          className="lg:hidden border-t border-black/10 bg-cream animate-[menu-in_180ms_ease-out]"
        >
          <NavLink to="/products" onClick={closeMenu} className={mobileNavLinkClass}>Shop</NavLink>
          <NavLink to="/favorites" onClick={closeMenu} className={mobileNavLinkClass}>Favourites</NavLink>
          {user && (
            <NavLink to="/cart" onClick={closeMenu} className={mobileNavLinkClass}>
              Cart{count > 0 && <span className="ml-1 text-gold">({count})</span>}
            </NavLink>
          )}
          {user && (
            <NavLink to="/report-issue" onClick={closeMenu} className={mobileNavLinkClass}>Report Issue</NavLink>
          )}
          {user ? (
            <NavLink to="/account" onClick={closeMenu} className={mobileNavLinkClass}>{user.firstName}</NavLink>
          ) : rider ? (
            <NavLink to="/rider" onClick={closeMenu} className={mobileNavLinkClass}>{rider.name}</NavLink>
          ) : (
            <NavLink to="/login" onClick={closeMenu} className={mobileNavLinkClass}>Sign in</NavLink>
          )}
          {user?.isAdmin && <NavLink to="/admin" onClick={closeMenu} className={mobileNavLinkClass}>Admin</NavLink>}
          {(user || rider) && (
            <button
              onClick={signOut}
              className="block w-full text-left px-4 py-3 text-base tracking-wide text-black/50 hover:text-red-500 transition-colors border-t border-black/5"
            >
              Sign out
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
