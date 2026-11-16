"use client";

import { create } from "zustand";
import type { User, UserRole } from "./types";
import { useCartStore } from "./cart";
import { clearSession, loadActiveClub, loadSession, saveActiveClub, saveSession, updateStoredUser } from "./session";

interface AuthState {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  /** true une fois la session relue depuis le navigateur */
  hydrated: boolean;
  /** Raison de la dernière déconnexion (affichée sur l'écran de connexion) */
  logoutReason: "expired" | null;
  hydrate: () => void;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: (reason?: "expired") => void;
  /** Maître de salle : club sur lequel il travaille (en-tête X-Club-Id ; null = son premier club) */
  activeClubId: string | null;
  setActiveClub: (clubId: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  role: null,
  hydrated: false,
  logoutReason: null,
  activeClubId: null,

  setActiveClub: (activeClubId) => {
    saveActiveClub(activeClubId);
    set({ activeClubId });
  },

  hydrate: () => {
    if (get().hydrated) return;
    const s = loadSession();
    if (s) set({ user: s.user, token: s.token, role: s.user.role, hydrated: true, activeClubId: loadActiveClub() });
    else set({ hydrated: true });
  },

  setAuth: (user, token) => {
    saveSession(user, token);
    set({ user, token, role: user.role, hydrated: true, logoutReason: null });
  },

  setUser: (user) => {
    updateStoredUser(user);
    set({ user });
  },

  logout: (reason) => {
    clearSession();
    useCartStore.getState().clear(); // panier propre à chaque compte
    set({ user: null, token: null, role: null, logoutReason: reason ?? null, activeClubId: null });
  },
}));

interface NotifState {
  unreadCount: number;
  setUnreadCount: (n: number) => void;
  decrement: () => void;
}

export const useNotifStore = create<NotifState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  decrement: () => set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
}));
