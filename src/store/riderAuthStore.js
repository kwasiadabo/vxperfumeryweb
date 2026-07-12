import { create } from 'zustand';

// Rider session, separate from the customer/admin session in authStore
const savedRider = JSON.parse(localStorage.getItem('vx_rider') || 'null');
const savedMustSetPassword = localStorage.getItem('vx_rider_must_set_password') === 'true';

export const useRiderAuthStore = create((set) => ({
  rider: savedRider,
  mustSetPassword: savedMustSetPassword,
  login: (token, rider, mustSetPassword) => {
    localStorage.setItem('vx_rider_token', token);
    localStorage.setItem('vx_rider', JSON.stringify(rider));
    localStorage.setItem('vx_rider_must_set_password', String(Boolean(mustSetPassword)));
    set({ rider, mustSetPassword: Boolean(mustSetPassword) });
  },
  // called once the rider finishes password setup — swaps in the fresh token, no re-login needed
  passwordSet: (token) => {
    localStorage.setItem('vx_rider_token', token);
    localStorage.setItem('vx_rider_must_set_password', 'false');
    set({ mustSetPassword: false });
  },
  logout: () => {
    localStorage.removeItem('vx_rider_token');
    localStorage.removeItem('vx_rider');
    localStorage.removeItem('vx_rider_must_set_password');
    set({ rider: null, mustSetPassword: false });
  },
}));
