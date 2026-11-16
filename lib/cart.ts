"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Product } from "./types";

/** Ligne du panier. Le prix sert à l'affichage : l'API recalcule toujours le total à la commande. */
export interface CartLine {
  key: string;                  // produit + taille
  productId: string;
  nom: string;
  prix: number;
  image: string | null;
  taille: string | null;
  quantite: number;
}

export const MAX_QUANTITE = 99;

interface CartState {
  lines: CartLine[];
  add: (product: Product, taille: string | null, quantite: number) => void;
  setQuantite: (key: string, quantite: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const lineKey = (productId: string, taille: string | null) => `${productId}|${taille ?? ""}`;

// Gardé dans le navigateur (localStorage) : le panier survit au rechargement de la page
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (product, taille, quantite) =>
        set((s) => {
          const key = lineKey(product.id, taille);
          const existing = s.lines.find((l) => l.key === key);
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.key === key ? { ...l, quantite: Math.min(MAX_QUANTITE, l.quantite + quantite), prix: product.prix } : l,
              ),
            };
          }
          return {
            lines: [
              ...s.lines,
              { key, productId: product.id, nom: product.nom, prix: product.prix, image: product.images?.[0] ?? null, taille, quantite },
            ],
          };
        }),
      setQuantite: (key, quantite) =>
        set((s) => ({ lines: s.lines.map((l) => (l.key === key ? { ...l, quantite: Math.max(1, Math.min(MAX_QUANTITE, quantite)) } : l)) })),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "lcc_web_cart", storage: createJSONStorage(() => localStorage) },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantite, 0);
export const cartTotal = (lines: CartLine[]) => lines.reduce((n, l) => n + l.prix * l.quantite, 0);
