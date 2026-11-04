"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Chip de filtre (onglets rapides des écrans Événements / Techniques) */
export function Chip({
  active,
  onClick,
  children,
  color = "primary",
  className,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  color?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[13px] font-semibold whitespace-nowrap transition-colors",
        active
          ? color === "secondary"
            ? "border-secondary bg-secondary text-white"
            : "border-primary bg-primary text-white"
          : "border-line bg-surface text-muted hover:border-[#4a4a4c] hover:text-white",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Rangée de chips : défilement horizontal sur mobile, retour à la ligne à partir de la tablette */
export function ChipRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  ariaLabel,
  accent = "primary",
}: {
  accent?: "primary" | "secondary";
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string; icon?: ReactNode; badge?: ReactNode }>;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn("inline-flex rounded-md border border-line bg-surface p-1", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-sm px-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors [&_svg]:size-4",
              active ? (accent === "secondary" ? "bg-secondary text-white" : "bg-primary text-white") : "text-muted hover:text-white",
            )}
          >
            {o.icon}
            {o.label}
            {o.badge}
          </button>
        );
      })}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  disabled,
  label,
  color = "primary",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
  color?: "primary" | "secondary";
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-[30px] w-[52px] shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
        checked ? (color === "secondary" ? "bg-secondary" : "bg-primary") : "bg-line",
      )}
    >
      <span
        className={cn(
          "absolute left-[3px] size-6 rounded-full bg-white shadow transition-transform duration-200",
          checked && "translate-x-[22px]",
        )}
      />
    </button>
  );
}
