import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Footer() {
  const user = useAuthStore((s) => s.user);
  return (
    <footer className="bg-ink-deep text-white/70 mt-auto border-t border-gold/40">
      <div className="w-full mx-auto max-w-6xl px-4 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <p className="font-display text-xl tracking-widest text-white">
            VX <span className="text-gold">PERFUMERY</span>
          </p>
          <p className="mt-2.5 text-sm leading-relaxed">
            Curated fine fragrances from the world's greatest houses,
            delivered across Ghana and West Africa.
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Contact Us</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href="tel:+233500008001" className="hover:text-gold transition-colors">
                Phone: +233 50 000 8001
              </a>
            </li>
            <li>
              <a href="https://wa.me/233500008001" target="_blank" rel="noreferrer" className="hover:text-gold transition-colors">
                WhatsApp: +233 50 000 8001
              </a>
            </li>
            <li>
              <a href="mailto:vxperfurmery@variablexsolutions.com" className="hover:text-gold transition-colors break-all">
                Email: vxperfurmery@variablexsolutions.com
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Quick Links</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/products" className="hover:text-gold transition-colors">Shop the Collection</Link></li>
            <li><Link to="/favorites" className="hover:text-gold transition-colors">Favourites</Link></li>
            {user && <li><Link to="/cart" className="hover:text-gold transition-colors">Cart</Link></li>}
            <li><Link to="/account" className="hover:text-gold transition-colors">My Account</Link></li>
            <li><Link to="/rider" className="hover:text-gold transition-colors">Rider Portal</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="w-full mx-auto max-w-6xl px-4 py-4 text-center text-xs text-white/40">
          © {new Date().getFullYear()} VX Perfumery · Fine Fragrances · Secured payments by Paystack
        </p>
      </div>
    </footer>
  );
}
