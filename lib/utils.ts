import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
/** Domaine Laravel sans /api/v1 (fichiers publics, routes OAuth) */
export const LARAVEL_URL = API_URL.replace(/\/api\/v1\/?$/, "");
export const WEBADMIN_URL = process.env.NEXT_PUBLIC_WEBADMIN_URL ?? "http://localhost:3000";

/** Résout un chemin de fichier renvoyé par Laravel en URL absolue */
export function storageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith("/")) return `${LARAVEL_URL}${path}`;
  return `${LARAVEL_URL}/storage/${path}`;
}

export function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function formatPrice(v: unknown): string | null {
  const n = toNumber(v);
  return n === null ? null : `${n.toLocaleString("fr-FR")} FCFA`;
}

export function fullName(p?: { prenom?: string | null; nom?: string | null } | null): string {
  return `${p?.prenom ?? ""} ${p?.nom ?? ""}`.trim();
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function plural(n: number, singular: string, pluralForm = `${singular}s`) {
  return `${n} ${n > 1 ? pluralForm : singular}`;
}
