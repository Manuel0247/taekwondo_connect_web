// Formats de date en français (repris de src/utils/formatDate.ts du mobile)

const safe = (s: string) => new Date(s);

export function formatDate(s: string): string {
  return safe(s).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function formatShortDate(s: string): string {
  return safe(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export function formatDateTime(s: string): string {
  return safe(s).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(s: string): string {
  return safe(s).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function formatWeekday(s: string): string {
  return safe(s).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

export function formatRelative(s: string): string {
  const diff = Date.now() - safe(s).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  if (hours < 24) return `Il y a ${hours} h`;
  if (days < 7) return `Il y a ${days} j`;
  return formatShortDate(s);
}

export function formatMonthYear(d: Date): string {
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

/** Date ISO → "AAAA-MM-JJ" (pour <input type="date">) */
export function toDateInput(s?: string | null): string {
  if (!s) return "";
  return s.slice(0, 10);
}

export function todayInput(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function dayKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
