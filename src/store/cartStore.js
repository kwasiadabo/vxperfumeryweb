import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Local cart for browsing; synced to the server cart at login/checkout.
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // [{ product, quantity }]
      addItem: (product, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
              ),
            };
          }
          return { items: [...state.items, { product, quantity }] };
        }),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.product.id === productId ? { ...i, quantity } : i))
            .filter((i) => i.quantity > 0),
        })),
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.product.id !== productId) })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0),
    }),
    { name: 'vx-cart' }
  )
);
