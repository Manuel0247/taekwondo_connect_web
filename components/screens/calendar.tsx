"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarX2, Clock } from "lucide-react";
import { EVENT_TYPES } from "@/lib/config";
import { dayKey, formatTime, formatWeekday } from "@/lib/format";
import type { InscriptionStatut, LeagueEvent } from "@/lib/types";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { ErrorState, Skeleton } from "@/components/ui/display";
import { EventBadge, InscriptionBadge } from "@/components/domain/cards";
import { MonthCalendar } from "@/components/domain/month-calendar";

export type CalendarItem = { id: string; event: LeagueEvent; statut?: InscriptionStatut };

export function CalendarScreen({
  title, subtitle, backHref, items, isLoading, isError, onRetry, hrefFor, accent = "primary",
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  items: CalendarItem[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  hrefFor: (eventId: string) => string;
  accent?: "primary" | "secondary";
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(dayKey(now.getFullYear(), now.getMonth(), now.getDate()));

  const byDate = useMemo(() => {
    const m = new Map<string, CalendarItem[]>();
    items.forEach((i) => {
      // Clé locale (et non UTC) pour coller à l'affichage
      const d = new Date(i.event.date_debut);
      const k = dayKey(d.getFullYear(), d.getMonth(), d.getDate());
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(i);
    });
    return m;
  }, [items]);

  const dots = useMemo(() => {
    const m = new Map<string, string[]>();
    byDate.forEach((list, k) => m.set(k, [...new Set(list.map((i) => (EVENT_TYPES[i.event.type] ?? EVENT_TYPES.competition).color))]));
    return m;
  }, [byDate]);

  const dayItems = (byDate.get(selected) ?? []).sort((a, b) => a.event.date_debut.localeCompare(b.event.date_debut));
  const [sy, sm, sd] = selected.split("-").map(Number);
  const selLabel = formatWeekday(new Date(sy, sm - 1, sd).toISOString());
  const monthCount = items.filter((i) => {
    const d = new Date(i.event.date_debut);
    return d.getFullYear() === year && d.getMonth() === month;
  }).length;

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} backHref={backHref} size="lg" />
      <PageContainer size="lg" className="mt-3 grid grid-cols-1 gap-6 md:mt-0 lg:grid-cols-[420px_minmax(0,1fr)]">
        <div>
          {isLoading ? (
            <Skeleton className="h-[380px] rounded-lg" />
          ) : (
            <MonthCalendar
              year={year}
              month={month}
              selected={selected}
              onSelect={setSelected}
              onMonthChange={(y, m) => {
                setYear(y);
                setMonth(m);
              }}
              dots={dots}
              accent={accent}
            />
          )}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 px-1 text-xs text-muted">
            {Object.values(EVENT_TYPES).map((t) => (
              <span key={t.label} className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ backgroundColor: t.color }} />
                {t.label}
              </span>
            ))}
          </div>
          {!isLoading && (
            <p className="mt-2 px-1 text-xs text-muted">
              {monthCount} événement{monthCount > 1 ? "s" : ""} ce mois-ci
            </p>
          )}
        </div>

        <section aria-live="polite">
          <div className="mb-3 flex items-baseline justify-between border-b border-line pb-3">
            <h2 className="text-base font-bold text-white capitalize">{selLabel}</h2>
            {dayItems.length > 0 && (
              <span className="text-xs font-semibold text-muted">
                {dayItems.length} événement{dayItems.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          {isError ? (
            <ErrorState onRetry={onRetry} />
          ) : dayItems.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center text-muted">
              <CalendarX2 className="mb-3 size-11 text-line" strokeWidth={1.5} />
              <p className="text-sm">Aucun événement ce jour</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {dayItems.map((i) => (
                <li key={i.id}>
                  <Link href={hrefFor(i.event.id)} className="flex items-center gap-3 rounded-md bg-surface p-3.5 transition-colors hover:bg-surface-2">
                    <div className="min-w-0 flex-1">
                      <EventBadge type={i.event.type} tone="soft" />
                      <p className="mt-1.5 line-clamp-2 text-[15px] font-bold text-white">{i.event.titre}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                        <Clock className="size-3.5 shrink-0" />
                        {formatTime(i.event.date_debut)}
                        {i.event.adresse && <span className="truncate">· {i.event.adresse}</span>}
                      </p>
                    </div>
                    {i.statut && <InscriptionBadge statut={i.statut} />}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </PageContainer>
    </>
  );
}
