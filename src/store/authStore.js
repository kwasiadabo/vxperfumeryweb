import { create } from 'zustand';
import { useCartStore } from './cartStore';

function readSavedUser() {
  try {
    return JSON.parse(localStorage.getItem('vx_user') || 'null');
  } catch {
    localStorage.removeItem('vx_user');
    return null;
  }
}

const savedUser = readSavedUser();

export const useAuthStore = create((set) => ({
  user: savedUser,
  login: (token, user) => {
    localStorage.setItem('vx_token', token);
    localStorage.setItem('vx_user', JSON.stringify(user ?? null));
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
