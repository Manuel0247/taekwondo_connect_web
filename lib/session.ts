// Persistance de la session navigateur.
// - Cookies lisibles par proxy.ts pour protéger les routes sans flash de contenu.
//   Noms distincts du webadmin (lcc_token) : sur localhost les cookies sont partagés entre ports.
// - localStorage pour le profil utilisateur (affichage immédiat au rechargement).
import type { User, UserRole } from "./types";

export const TOKEN_COOKIE = "lcc_web_token";
export const ROLE_COOKIE = "lcc_web_role";
const USER_KEY = "lcc_web_user";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 jours (durée de vie côté navigateur)

function setCookie(name: string, value: string, maxAge: number) {
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export function saveSession(user: User, token: string) {
  setCookie(TOKEN_COOKIE, token, MAX_AGE);
  setCookie(ROLE_COOKIE, user.role, MAX_AGE);
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

export function updateStoredUser(user: User) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

export function clearSession() {
  setCookie(TOKEN_COOKIE, "", 0);
  setCookie(ROLE_COOKIE, "", 0);
  try {
    localStorage.removeItem(USER_KEY);
  } catch {}
}

export function loadSession(): { user: User; token: string } | null {
  const token = getCookie(TOKEN_COOKIE);
  if (!token) return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return { user: JSON.parse(raw) as User, token };
  } catch {
    return null;
  }
}

export function homeForRole(role?: UserRole | string | null): string {
  if (role === "athlete") return "/athlete";
  if (role === "maitre_salle") return "/maitre";
  return "/connexion";
}
