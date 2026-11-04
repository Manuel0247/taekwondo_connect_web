"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifStore } from "@/lib/stores";

/** Conteneur de page : marges responsive et largeur maximale lisible */
export function PageContainer({ children, className, size = "xl" }: { children: ReactNode; className?: string; size?: "md" | "lg" | "xl" }) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        size === "md" && "max-w-3xl",
        size === "lg" && "max-w-5xl",
        size === "xl" && "max-w-7xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * En-tête de page. Sur smartphone : barre collante compacte (comme Header.tsx du mobile) ;
 * sur grand écran : titre large avec sous-titre et actions alignées à droite.
 */
export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = "Retour",
  actions,
  size = "xl",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-ink/90 pt-safe backdrop-blur-md md:static md:border-0 md:bg-transparent md:backdrop-blur-none">
      <PageContainer size={size} className="flex min-h-16 items-center gap-3 py-3 md:min-h-0 md:pt-8 md:pb-6">
        {backHref && (
          <Link
            href={backHref}
            className="-ml-2 grid size-10 shrink-0 place-items-center rounded-full text-white hover:bg-white/5 md:-ml-1 md:border md:border-line md:bg-surface"
            aria-label={backLabel}
            title={backLabel}
          >
            <ArrowLeft className="size-[22px] md:size-5" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold text-white md:text-[28px] md:leading-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 truncate text-[13px] text-muted md:text-sm">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </PageContainer>
    </header>
  );
}

export function NotificationBell({ href }: { href: string }) {
  const unread = useNotifStore((s) => s.unreadCount);
  return (
    <Link
      href={href}
      className="relative grid size-11 place-items-center rounded-full border border-line bg-surface text-white transition-colors hover:bg-surface-3"
      aria-label={unread > 0 ? `Notifications (${unread} non lues)` : "Notifications"}
    >
      <Bell className="size-[22px]" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-ink">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}

export function IconAction({
  onClick, href, label, children, className,
}: {
  onClick?: () => void; href?: string; label: string; children: ReactNode; className?: string;
}) {
  const cls = cn(
    "grid size-11 place-items-center rounded-full border border-line bg-surface text-white transition-colors hover:bg-surface-3 [&_svg]:size-5",
    className,
  );
  if (href) {
    return (
      <Link href={href} className={cls} aria-label={label} title={label}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls} aria-label={label} title={label}>
      {children}
    </button>
  );
}
