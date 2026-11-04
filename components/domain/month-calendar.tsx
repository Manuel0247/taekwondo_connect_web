"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { dayKey, formatMonthYear } from "@/lib/format";

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const DAY_NAMES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

function buildGrid(year: number, month: number): Array<number | null> {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7; // semaine commençant lundi
  const days = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = Array(offset).fill(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/**
 * Grille mensuelle des écrans Calendrier (athlète et maître) : points colorés
 * par type d'événement, aujourd'hui entouré, jour sélectionné plein.
 * Navigation clavier : flèches pour changer de jour.
 */
export function MonthCalendar({
  year, month, selected, onSelect, onMonthChange, dots, accent = "primary",
}: {
  year: number;
  month: number;
  selected: string;
  onSelect: (key: string) => void;
  onMonthChange: (y: number, m: number) => void;
  dots: Map<string, string[]>;
  accent?: "primary" | "secondary";
}) {
  const today = new Date();
  const todayKey = dayKey(today.getFullYear(), today.getMonth(), today.getDate());
  const grid = buildGrid(year, month);
  const shift = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    onMonthChange(d.getFullYear(), d.getMonth());
  };
  const selBg = accent === "secondary" ? "bg-secondary" : "bg-primary";
  const todayRing = accent === "secondary" ? "ring-secondary-light text-secondary-light" : "ring-primary text-primary";

  const moveSelection = (days: number) => {
    const [y, m, d] = selected.split("-").map(Number);
    const n = new Date(y, m - 1, d + days);
    if (n.getMonth() !== month || n.getFullYear() !== year) onMonthChange(n.getFullYear(), n.getMonth());
    onSelect(dayKey(n.getFullYear(), n.getMonth(), n.getDate()));
  };

  return (
    <div className="rounded-lg bg-surface p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} className="grid size-10 place-items-center rounded-full text-white hover:bg-white/5" aria-label="Mois précédent">
          <ChevronLeft className="size-5" />
        </button>
        <p className="text-base font-bold text-white capitalize" aria-live="polite">
          {formatMonthYear(new Date(year, month, 1))}
        </p>
        <button type="button" onClick={() => shift(1)} className="grid size-10 place-items-center rounded-full text-white hover:bg-white/5" aria-label="Mois suivant">
          <ChevronRight className="size-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center" role="row">
        {DAY_LABELS.map((l, i) => (
          <abbr key={i} title={DAY_NAMES[i]} className="pb-2 text-xs font-semibold text-muted no-underline">
            {l}
          </abbr>
        ))}
      </div>
      <div
        className="grid grid-cols-7 gap-y-1"
        role="grid"
        onKeyDown={(e) => {
          const map: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
          if (map[e.key]) {
            e.preventDefault();
            moveSelection(map[e.key]);
          }
        }}
      >
        {grid.map((day, idx) => {
          if (!day) return <span key={idx} />;
          const k = dayKey(year, month, day);
          const types = dots.get(k) ?? [];
          const isSel = k === selected;
          const isToday = k === todayKey;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelect(k)}
              tabIndex={isSel ? 0 : -1}
              aria-pressed={isSel}
              aria-label={`${day}${types.length ? `, ${types.length} événement${types.length > 1 ? "s" : ""}` : ""}`}
              className="group flex flex-col items-center gap-1 py-0.5"
            >
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-full text-sm font-semibold transition-colors sm:size-10",
                  isSel ? cn(selBg, "text-white") : isToday ? cn("ring-[1.5px]", todayRing) : "text-white group-hover:bg-white/5",
                )}
              >
                {day}
              </span>
              <span className="flex h-1.5 gap-0.5">
                {types.slice(0, 3).map((c, i) => (
                  <span key={i} className="size-1.5 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
