import { GRADES, GRADE_COLORS, GRADE_LABELS, gradeAccent } from "@/lib/config";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Grade, GradeHistorique } from "@/lib/types";

/** Progression des ceintures (GradeProgress.tsx) */
export function GradeProgress({ current }: { current?: Grade | null }) {
  const g = current ?? "blanc";
  const idx = GRADES.indexOf(g);
  return (
    <div className="flex flex-col items-center py-1">
      <ol className="flex w-full max-w-md items-center" aria-label={`Grade actuel : ${GRADE_LABELS[g]}`}>
        {GRADES.map((grade, i) => {
          const c = GRADE_COLORS[grade];
          const active = i <= idx;
          return (
            <li key={grade} className={cn("flex items-center", i < GRADES.length - 1 && "flex-1")}>
              <span
                title={GRADE_LABELS[grade]}
                className={cn("size-5 shrink-0 rounded-full sm:size-6", i === idx && "ring-2 ring-white/70 ring-offset-2 ring-offset-surface")}
                style={{
                  backgroundColor: active ? c.bg : "#3A3A3C",
                  border: grade === "noir" && active ? "1px solid #8E8E93" : undefined,
                }}
              />
              {i < GRADES.length - 1 && (
                <span className="h-[3px] flex-1" style={{ backgroundColor: active && i < idx ? c.bg : "#3A3A3C" }} />
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-xs text-muted">{GRADE_LABELS[g]}</p>
    </div>
  );
}

/** Frise chronologique des grades (HistoriqueGradesScreen) */
export function GradeTimeline({ items }: { items: GradeHistorique[] }) {
  return (
    <ol className="relative">
      {items.map((h, i) => {
        const c = GRADE_COLORS[h.grade] ?? GRADE_COLORS.blanc;
        const accent = gradeAccent(h.grade);
        return (
          <li key={`${h.grade}-${h.date}-${i}`} className="relative flex gap-4 pb-4 last:pb-0">
            <div className="relative flex w-5 shrink-0 justify-center">
              <span className="z-10 mt-4 size-4 rounded-full border-2" style={{ backgroundColor: c.bg, borderColor: c.border ?? c.bg }} />
              {i < items.length - 1 && <span className="absolute top-8 bottom-[-16px] w-0.5 bg-line" />}
            </div>
            <div className="flex-1 rounded-md border-l-4 bg-surface p-3.5" style={{ borderLeftColor: accent }}>
              <p className="text-[15px] font-bold" style={{ color: accent }}>
                {GRADE_LABELS[h.grade] ?? h.grade}
              </p>
              <p className="mt-0.5 text-[13px] text-muted">{formatDate(h.date)}</p>
              {h.commentaire && <p className="mt-1 text-[13px] text-white/80">{h.commentaire}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
