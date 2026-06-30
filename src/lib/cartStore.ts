"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const LIMITES_CATEGORIA: Record<string, number> = {
  brownie: 18,
  galleta: 14,
};

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  emoji: string;
  detalle?: string;
  categoria?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
  isAtCategoryLimit: (categoria: string) => boolean;
}

function categoryTotal(items: CartItem[], categoria: string): number {
  return items.filter(i => i.categoria === categoria).reduce((s, i) => s + i.quantity, 0);
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        const items = get().items;
        const cat = product.categoria;
        if (cat && LIMITES_CATEGORIA[cat] !== undefined) {
          if (categoryTotal(items, cat) >= LIMITES_CATEGORIA[cat]) return;
        }
        const existing = items.find((i) => i.id === product.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({ items: [...items, { ...product, quantity: 1 }] });
        }
      },

      removeItem: (id) =>
        set({ items: get().items.filter((i) => i.id !== id) }),

      updateQuantity: (id, delta) => {
        if (delta > 0) {
          const items = get().items;
          const item = items.find(i => i.id === id);
          const cat = item?.categoria;
          if (cat && LIMITES_CATEGORIA[cat] !== undefined) {
            if (categoryTotal(items, cat) >= LIMITES_CATEGORIA[cat]) return;
          }
        }
        const items = get().items.map((i) =>
          i.id === id ? { ...i, quantity: Math.min(99, i.quantity + delta) } : i
        );
        set({ items: items.filter((i) => i.quantity > 0) });
      },

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      isAtCategoryLimit: (categoria) => {
        const limite = LIMITES_CATEGORIA[categoria];
        if (limite === undefined) return false;
        return categoryTotal(get().items, categoria) >= limite;
      },
    }),
    { name: "brownielab-cart" }
  )
);
