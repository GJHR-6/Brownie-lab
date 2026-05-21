"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Producto } from "@/types/database";

const MAX = 4;

interface RecentStore {
  productos: Producto[];
  add: (p: Producto) => void;
}

export const useRecentStore = create<RecentStore>()(
  persist(
    (set) => ({
      productos: [],
      add: (p) =>
        set((s) => ({
          productos: [p, ...s.productos.filter((x) => x.id !== p.id)].slice(0, MAX),
        })),
    }),
    { name: "brownie-recent" }
  )
);
