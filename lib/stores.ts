"use client";

import { create } from "zustand";
import type { User, UserRole } from "./types";
import { clearSession, loadSession, saveSession, updateStoredUser } from "./session";

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
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  role: null,
  hydrated: false,
  logoutReason: null,

  hydrate: () => {
    if (get().hydrated) return;
    const s = loadSession();
    if (s) set({ user: s.user, token: s.token, role: s.user.role, hydrated: true });
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
    set({ user: null, token: null, role: null, logoutReason: reason ?? null });
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
