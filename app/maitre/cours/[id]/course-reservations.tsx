"use client";

import { CheckCircle2, Hourglass, Users } from "lucide-react";
import { useCourseDetail, useCourseReservations } from "@/lib/hooks/courses";
import { COURSE_LEVELS, COLORS, formatJours } from "@/lib/config";
import { formatDate, formatTime } from "@/lib/format";
import { fullName } from "@/lib/utils";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { Avatar, Badge, Card, EmptyState, ErrorState, ProgressBar, SkeletonList } from "@/components/ui/display";

export function CourseReservations({ id }: { id: string }) {
  const course = useCourseDetail(id);
  const { data, isLoading, isError, refetch } = useCourseReservations(id);
  const list = data ?? [];
  const confirmed = list.filter((r) => r.statut === "confirme");
  const waiting = list.filter((r) => r.statut === "liste_attente").sort((a, b) => (a.position_attente ?? 0) - (b.position_attente ?? 0));
  const c = course.data;

  return (
    <>
      <PageHeader title="Réservations" subtitle={c?.titre} backHref="/maitre/cours" size="lg" />
      <PageContainer size="lg" className="mt-4 grid grid-cols-1 gap-6 md:mt-0 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4">
          {c && (
            <Card>
              <Badge label={COURSE_LEVELS[c.niveau]?.label ?? c.niveau} color={COURSE_LEVELS[c.niveau]?.color ?? COLORS.info} size="sm" />
              <p className="mt-2 text-lg font-bold text-white">{c.titre}</p>
              <p className="mt-1 text-sm text-muted">
                {formatDate(c.date_debut)} · {formatTime(c.date_debut)} – {formatTime(c.date_fin)}
              </p>
              {c.est_recurrent && <p className="mt-1 text-xs text-secondary-light">Chaque semaine : {formatJours(c.jours_recurrence)}</p>}
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-xs text-muted">
                  <span>Places occupées</span>
                  <span>
                    {c.places_total - (c.places_disponibles ?? c.places_total)} / {c.places_total}
                  </span>
                </div>
                <ProgressBar value={c.places_total ? (c.places_total - (c.places_disponibles ?? c.places_total)) / c.places_total : 0} color={COLORS.secondaryLight} />
              </div>
            </Card>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-md border border-secondary-light/50 p-3 text-sm font-semibold text-secondary-light">
              <CheckCircle2 className="size-4" /> {confirmed.length} confirmés
            </div>
            <div className="flex items-center gap-2 rounded-md border border-primary/50 p-3 text-sm font-semibold text-primary">
              <Hourglass className="size-4" /> {waiting.length} en attente
            </div>
          </div>
        </aside>

        <section>
          {isLoading ? (
            <SkeletonList count={3} />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : list.length === 0 ? (
            <EmptyState icon={Users} message="Aucune réservation" description="Les athlètes du club peuvent réserver depuis leur espace." />
          ) : (
            <ul className="space-y-2">
              {[...confirmed, ...waiting].map((r) => {
                const name = fullName(r.athlete?.user ?? r.athlete) || "Athlète";
                return (
                  <li key={r.id} className="flex items-center gap-3 rounded-md bg-surface p-3">
                    <Avatar src={r.athlete?.user?.photo_url ?? r.athlete?.photo_url} name={name} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-white">{name}</p>
                      {r.statut === "liste_attente" && <p className="text-xs text-primary">Position #{r.position_attente}</p>}
                    </div>
                    <Badge
                      label={r.statut === "confirme" ? "Confirmé" : "Attente"}
                      color={r.statut === "confirme" ? COLORS.secondary : COLORS.primary}
                      size="sm"
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </PageContainer>
    </>
  );
}
