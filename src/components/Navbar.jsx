import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useRiderAuthStore } from '../store/riderAuthStore';

const navLinkClass = ({ isActive }) =>
  `text-sm tracking-wide transition-colors ${isActive ? 'text-gold' : 'text-black/60 hover:text-black'}`;

export default function Navbar() {
  const count = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const rider = useRiderAuthStore((s) => s.rider);
  const riderLogout = useRiderAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const signOut = () => {
    if (user) logout();
    if (rider) riderLogout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur border-b border-black/10">
      <div className="w-full mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-display text-2xl tracking-widest">
          VX <span className="text-gold">PERFUMERY</span>
        </Link>
        <nav className="flex items-center gap-6">
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
      </div>
    </header>
  );
}
