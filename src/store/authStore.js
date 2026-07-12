import { create } from 'zustand';
import { useCartStore } from './cartStore';

const savedUser = JSON.parse(localStorage.getItem('vx_user') || 'null');

export const useAuthStore = create((set) => ({
  user: savedUser,
  login: (token, user) => {
    localStorage.setItem('vx_token', token);
    localStorage.setItem('vx_user', JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    localStorage.removeItem('vx_token');
    localStorage.removeItem('vx_user');
    // the cart belongs to the signed-in session — don't leave it behind for the next user
    useCartStore.getState().clear();
    set({ user: null });
  },
}));
