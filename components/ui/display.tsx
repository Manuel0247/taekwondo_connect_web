import type { CSSProperties, ReactNode } from "react";
import { AlertTriangle, RefreshCw, SearchX, type LucideIcon } from "lucide-react";
import { cn, storageUrl } from "@/lib/utils";
import { GRADE_COLORS, GRADE_SHORT, danLabel } from "@/lib/config";
import type { Grade } from "@/lib/types";
import { Button } from "./button";

export function Card({ className, children, style }: { className?: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <div className={cn("rounded-lg bg-surface p-4 shadow-[0_2px_12px_rgba(0,0,0,0.25)]", className)} style={style}>
      {children}
    </div>
  );
}

/** Pastille pleine (Badge.tsx) ou teintée (pastilles de statut des écrans) */
export function Badge({
  label,
  color,
  tone = "solid",
  size = "md",
  icon,
  className,
}: {
  label: string;
  color: string;
  tone?: "solid" | "soft";
  size?: "sm" | "md";
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full font-semibold whitespace-nowrap [&_svg]:size-3",
        size === "sm" ? "px-2 py-[3px] text-[11px]" : "px-3 py-[5px] text-xs",
        className,
      )}
      style={
        tone === "solid"
          ? { backgroundColor: color, color: "#fff" }
          : { backgroundColor: `${color}22`, color }
      }
    >
      {icon}
      {label}
    </span>
  );
}

/** Étiquette à bordure (Tag.tsx) — vert par défaut */
export function Tag({ label, color = "#2EA55A", className }: { label: string; color?: string; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-sm border px-2.5 py-1 text-xs font-semibold", className)}
      style={{ borderColor: color, color }}
    >
      {label}
    </span>
  );
}

/** `dan` : à passer seulement côté maître (l'athlète ne voit que « Noir ») */
export function GradeChip({ grade, dan, className }: { grade?: Grade | null; dan?: number | null; className?: string }) {
  const g = grade ?? "blanc";
  const c = GRADE_COLORS[g] ?? GRADE_COLORS.blanc;
  return (
    <span
      className={cn("inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-bold", className)}
      style={{ backgroundColor: c.bg, color: c.text, border: c.border ? `1px solid ${c.border}` : undefined }}
    >
      {GRADE_SHORT[g]}{g === "noir" && dan ? ` · ${danLabel(dan)}` : ""}
    </span>
  );
}

export function Avatar({
  src,
  name,
  size = 44,
  className,
}: {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
}) {
  const url = storageUrl(src);
  const initials =
    (name ?? "")
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- fichiers servis par l'API (domaine configurable)
      <img
        src={url}
        alt={name ? `Photo de ${name}` : ""}
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white", className)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden={!name}
    >
      {initials}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-surface-3/70", className)} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg bg-surface p-4", className)} aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
      </div>
      <Skeleton className="mt-4 h-3 w-4/5" />
    </div>
  );
}

export function SkeletonList({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-3", className)} role="status" aria-label="Chargement">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function EmptyState({
  message,
  description,
  icon: Icon = SearchX,
  action,
  className,
}: {
  message: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center animate-fade-in", className)}>
      <span className="mb-4 grid size-16 place-items-center rounded-full bg-surface text-muted">
        <Icon className="size-8" strokeWidth={1.6} />
      </span>
      <p className="text-[15px] font-semibold text-white">{message}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message = "Impossible de charger les données",
  description = "Vérifiez votre connexion puis réessayez.",
  onRetry,
  className,
}: {
  message?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center", className)} role="alert">
      <span className="mb-4 grid size-16 place-items-center rounded-full bg-danger/15 text-[#f87171]">
        <AlertTriangle className="size-8" strokeWidth={1.6} />
      </span>
      <p className="text-[15px] font-semibold text-white">{message}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry} icon={<RefreshCw className="size-4" />}>
          Réessayer
        </Button>
      )}
    </div>
  );
}

export function ProgressBar({ value, color = "#E8650A", className }: { value: number; color?: string; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div
      className={cn("h-2 overflow-hidden rounded-full bg-line", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export function SectionTitle({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <h2 className="text-[17px] font-bold text-white">{children}</h2>
      {action}
    </div>
  );
}

export function InfoRow({ icon, label, value }: { icon?: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      {icon && <span className="mt-0.5 text-muted [&_svg]:size-4">{icon}</span>}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">{label}</p>
        <div className="mt-0.5 text-sm font-semibold break-words text-white">{value}</div>
      </div>
    </div>
  );
}
