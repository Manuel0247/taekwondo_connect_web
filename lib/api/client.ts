import axios from "axios";
import { API_URL } from "../utils";
import { useAuthStore } from "../stores";

// Pas de Content-Type par défaut : axios met JSON pour les objets et laisse
// le navigateur poser la frontière multipart pour les FormData (uploads).
export const api = axios.create({
  baseURL: API_URL,
  headers: { Accept: "application/json" },
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Jeton expiré ou révoqué : déconnexion + message « Session expirée » (règle métier 6)
    const status = error?.response?.status;
    const sentToken = !!error?.config?.headers?.Authorization;
    const isLogout = String(error?.config?.url ?? "").includes("/auth/logout");
    if (status === 401 && sentToken && !isLogout && useAuthStore.getState().token) {
      useAuthStore.getState().logout("expired");
    }
    return Promise.reject(error);
  },
);

export type Envelope<T> = { success: boolean; data: T; message?: string };

/** Extrait `data` de l'enveloppe { success, data } */
export async function unwrap<T>(p: Promise<{ data: Envelope<T> }>): Promise<T> {
  const res = await p;
  return res.data.data;
}
