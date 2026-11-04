"use client";

import Link from "next/link";
import { AlertCircle, CalendarCheck, CalendarRange, ChevronRight, Clock, Hourglass, Plus, RefreshCw, Users, CalendarDays } from "lucide-react";
import { useAuthStore } from "@/lib/stores";
import { useMyClub } from "@/lib/hooks/clubs";
import { useClubAthletes, useClubAthletesPending } from "@/lib/hooks/athletes";
import { useMyCourses } from "@/lib/hooks/courses";
import { COLORS } from "@/lib/config";
import { fullName } from "@/lib/utils";
import { IconAction, NotificationBell, PageContainer } from "@/components/layout/page";
import { EmptyState, SectionTitle, Skeleton } from "@/components/ui/display";
import { LinkButton } from "@/components/ui/button";
import { AthleteRow, CourseCard, StatCard } from "@/components/domain/cards";
import { PendingActions } from "@/components/screens/pending-actions";

export default function MaitreDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const club = useMyClub();
  const valid = useClubAthletes();
  const pending = useClubAthletesPending();
  const courses = useMyCourses();

  const c = club.data;
  const validated = valid.data ?? [];
  const pendingList = pending.data ?? [];
  const allCourses = courses.data ?? [];
  const upcoming = allCourses
    .filter((x) => x.statut !== "annule" && new Date(x.date_fin) >= new Date())
    .sort((a, b) => a.date_debut.localeCompare(b.date_debut));
  const reservations = allCourses.reduce((n, x) => n + (x.places_total - (x.places_disponibles ?? x.places_total)), 0);
  const loadingStats = valid.isLoading || pending.isLoading || courses.isLoading;

  const refresh = () => {
    club.refetch();
    valid.refetch();
    pending.refetch();
    courses.refetch();
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line/60 bg-ink/90 pt-safe backdrop-blur-md md:static md:border-0 md:bg-transparent">
        <PageContainer className="flex items-center gap-3 py-3 md:pt-8 md:pb-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold text-white md:text-[28px]">Mon Dashboard</h1>
            <p className="truncate text-[13px] text-muted md:text-sm">
              {fullName(user)}
              {c && <span className="text-secondary-light"> · {c.nom}</span>}
            </p>
          </div>
          <IconAction label="Actualiser" onClick={refresh} className="hidden sm:grid">
            <RefreshCw className={club.isFetching || valid.isFetching ? "animate-spin" : undefined} />
          </IconAction>
          <NotificationBell href="/maitre/notifications" />
        </PageContainer>
      </header>

      <PageContainer className="mt-4 space-y-6 md:mt-0">
        {/* Règle 2 : club non validé → bannière orange */}
        {c && c.statut !== "valide" && (
          <div className="flex items-center gap-3 rounded-md bg-primary p-3.5 text-ink" role="status">
            <Clock className="size-5 shrink-0" />
            <p className="text-sm font-bold">
              {c.statut === "suspendu" ? "Votre club est suspendu par la ligue" : "Votre club est en attente de validation"}
            </p>
          </div>
        )}
        {c && c.statut === "valide" && (!c.logo_url || !c.photos_urls?.length) && (
          <Link href="/maitre/club" className="flex items-center gap-3 rounded-md border border-warning/30 bg-warning/10 p-3.5 hover:bg-warning/15">
            <AlertCircle className="size-5 shrink-0 text-warning" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white">Profil club incomplet</p>
              <p className="text-xs text-muted">Ajoutez un logo et des photos pour attirer les athlètes</p>
            </div>
            <ChevronRight className="size-[18px] text-muted" />
          </Link>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {loadingStats ? (
            [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[124px] rounded-lg" />)
          ) : (
            <>
              <StatCard icon={<Users />} value={validated.length} label="Athlètes" color={COLORS.secondaryLight} href="/maitre/athletes" />
              <StatCard icon={<CalendarDays />} value={allCourses.length} label="Cours actifs" color={COLORS.primary} href="/maitre/cours" />
              <StatCard icon={<Hourglass />} value={pendingList.length} label="En attente" color={COLORS.warning} href="/maitre/athletes?onglet=attente" />
              <StatCard icon={<CalendarCheck />} value={reservations} label="Réservations" color={COLORS.infoLight} />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-6">
            {pendingList.length > 0 && (
              <section>
                <SectionTitle>Demandes en attente ({pendingList.length})</SectionTitle>
                <ul className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {pendingList.map((a) => (
                    <li key={a.id} className="rounded-lg bg-surface p-2">
                      <AthleteRow athlete={a} href={`/maitre/athletes/${a.id}`} showDate className="bg-transparent hover:bg-white/5" />
                      <div className="px-2 pt-1 pb-1">
                        <PendingActions athlete={a} />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <SectionTitle
                action={
                  <Link href="/maitre/cours" className="text-[13px] font-semibold text-secondary-light hover:underline">
                    Tous mes cours
                  </Link>
                }
              >
                Mes prochains cours
              </SectionTitle>
              {courses.isLoading ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-36 rounded-lg" />)}</div>
              ) : upcoming.length === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  message="Aucun cours à venir"
                  className="rounded-lg bg-surface py-10"
                  action={<LinkButton href="/maitre/cours/nouveau" variant="outline-secondary" size="sm" icon={<Plus className="size-4" />}>Créer un cours</LinkButton>}
                />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {upcoming.slice(0, 3).map((x) => (
                    <CourseCard key={x.id} course={x} href={`/maitre/cours/${x.id}`} />
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-3">
            <Shortcut href="/maitre/calendrier" icon={<CalendarRange />} title="Calendrier des événements" text="Voir tous les événements de la ligue" />
            <Shortcut href="/maitre/cours/nouveau" icon={<Plus />} title="Nouveau cours" text="Planifier une séance ou un cours récurrent" />
            <Shortcut href="/maitre/athletes/invitations" icon={<Users />} title="Inviter des athlètes" text="Envoyer une invitation par email" />
          </aside>
        </div>
      </PageContainer>
    </>
  );
}

function Shortcut({ href, icon, title, text }: { href: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg bg-surface p-4 transition-colors hover:bg-surface-2">
      <span className="grid size-10 place-items-center rounded-md bg-secondary/20 text-secondary-light [&_svg]:size-5">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold text-white">{title}</p>
        <p className="text-xs text-muted">{text}</p>
      </div>
      <ChevronRight className="size-[18px] text-muted" />
    </Link>
  );
}
