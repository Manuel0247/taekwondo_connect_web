"use client";

import Link from "next/link";
import { AlertCircle, CalendarDays, ChevronRight, RefreshCw, Shield, Trophy } from "lucide-react";
import { useAuthStore } from "@/lib/stores";
import { useMyAthleteProfile } from "@/lib/hooks/athletes";
import { useCancelReservation, useClubCourses, useMyReservations, useReserveCourse } from "@/lib/hooks/courses";
import { useMyEventInscriptions } from "@/lib/hooks/events";
import { fullName } from "@/lib/utils";
import type { Course } from "@/lib/types";
import { PageContainer, IconAction, NotificationBell } from "@/components/layout/page";
import { Avatar, Card, EmptyState, ErrorState, SectionTitle, Skeleton, SkeletonList } from "@/components/ui/display";
import { LinkButton } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/dialog";
import { ClubLogo, EventCard, ReservableCourse } from "@/components/domain/cards";

export default function AthleteHomePage() {
  const user = useAuthStore((s) => s.user);
  const confirm = useConfirm();
  const profile = useMyAthleteProfile();
  const athlete = profile.data;
  const clubId = athlete?.statut_club === "valide" ? (athlete.club_id ?? "") : "";
  const courses = useClubCourses(clubId);
  const reservations = useMyReservations();
  const inscriptions = useMyEventInscriptions();
  const reserve = useReserveCourse();
  const cancel = useCancelReservation();

  // Statut de réservation par cours (l'API renvoie aussi les réservations annulées)
  const reserved = new Map<string, "confirme" | "liste_attente">();
  (reservations.data ?? []).forEach((r) => {
    if (r.course?.id && (r.statut === "confirme" || r.statut === "liste_attente")) reserved.set(r.course.id, r.statut);
  });

  const upcomingEvents = (inscriptions.data ?? [])
    .filter((i) => i.statut !== "annule" && i.statut !== "refuse" && new Date(i.event.date_fin ?? i.event.date_debut) >= new Date())
    .sort((a, b) => a.event.date_debut.localeCompare(b.event.date_debut))
    .slice(0, 3);

  const onCancel = async (c: Course) => {
    if (
      await confirm({
        title: "Annuler la réservation",
        message: `Libérer votre place pour « ${c.titre} » ?`,
        confirmLabel: "Annuler la réservation",
        cancelLabel: "Garder",
        danger: true,
      })
    ) {
      cancel.mutate(c.id);
    }
  };

  const refresh = () => {
    profile.refetch();
    courses.refetch();
    reservations.refetch();
    inscriptions.refetch();
  };

  const incomplete = athlete && (!athlete.licence_url || !athlete.certificat_medical_url);
  const pendingClub = athlete?.club_id && athlete.statut_club === "en_attente";

  return (
    <>
      {/* En-tête : avatar + « Bonjour, {prénom} » + cloche */}
      <header className="sticky top-0 z-30 border-b border-line/60 bg-ink/90 pt-safe backdrop-blur-md md:static md:border-0 md:bg-transparent">
        <PageContainer className="flex items-center gap-3 py-3 md:pt-8 md:pb-6">
          <Avatar src={athlete?.user?.photo_url ?? user?.photo_url} name={fullName(user)} size={44} className="md:size-14" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-muted md:text-sm">Bonjour,</p>
            <h1 className="truncate text-lg font-extrabold text-white md:text-[28px]">{user?.prenom} 👋</h1>
          </div>
          <IconAction label="Actualiser" onClick={refresh} className="hidden sm:grid">
            <RefreshCw className={profile.isFetching ? "animate-spin" : undefined} />
          </IconAction>
          <NotificationBell href="/athlete/notifications" />
        </PageContainer>
      </header>

      <PageContainer className="mt-4 space-y-6 md:mt-0">
        {/* Bannière profil incomplet */}
        {incomplete && (
          <Link
            href="/athlete/profil/modifier"
            className="flex items-center gap-3 rounded-md border border-warning/30 bg-warning/10 p-3.5 transition-colors hover:bg-warning/15"
          >
            <AlertCircle className="size-5 shrink-0 text-warning" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white">Profil incomplet</p>
              <p className="text-xs text-muted">Finalisez votre inscription : licence et certificat médical</p>
            </div>
            <ChevronRight className="size-[18px] text-muted" />
          </Link>
        )}

        {profile.isError && <ErrorState onRetry={() => profile.refetch()} />}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
          {/* Colonne principale */}
          <div className="min-w-0 space-y-6">
            {/* Règle 3 : athlète sans club → CTA « Rejoindre un club » */}
            {athlete && !athlete.club_id && (
              <Card className="flex flex-col items-center p-6 text-center sm:flex-row sm:text-left">
                <span className="mb-3 grid size-14 shrink-0 place-items-center rounded-full bg-primary/12 text-primary sm:mr-5 sm:mb-0">
                  <Shield className="size-7" />
                </span>
                <div className="flex-1">
                  <p className="text-lg font-bold text-white">Rejoindre un club</p>
                  <p className="mt-1 text-sm text-muted">Intégrez un club pour accéder aux cours et compétitions.</p>
                </div>
                <LinkButton href="/athlete/clubs" className="mt-4 w-full sm:mt-0 sm:ml-5 sm:w-auto">
                  Trouver un club
                </LinkButton>
              </Card>
            )}

            {pendingClub && (
              <Card className="flex items-center gap-3 border border-primary/30">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/12 text-primary">
                  <Shield className="size-5" />
                </span>
                <div className="flex-1 text-sm">
                  <p className="font-bold text-white">Demande d&apos;adhésion en attente</p>
                  <p className="text-muted">
                    {athlete?.club?.nom ?? "Le club"} doit valider votre inscription avant que vous puissiez réserver des cours.
                  </p>
                </div>
              </Card>
            )}

            {clubId && (
              <section>
                <SectionTitle>Cours de mon club</SectionTitle>
                {courses.isLoading ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
                  </div>
                ) : courses.isError ? (
                  <ErrorState onRetry={() => courses.refetch()} />
                ) : (courses.data ?? []).length === 0 ? (
                  <EmptyState icon={CalendarDays} message="Aucun cours disponible pour le moment" className="rounded-lg bg-surface py-10" />
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {courses.data!.map((c) => (
                      <ReservableCourse
                        key={c.id}
                        course={c}
                        statut={reserved.get(c.id)}
                        onReserve={() => reserve.mutate(c.id)}
                        reserving={reserve.isPending && reserve.variables === c.id}
                        onCancel={() => onCancel(c)}
                        cancelling={cancel.isPending && cancel.variables === c.id}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {profile.isLoading && <SkeletonList count={2} />}
          </div>

          {/* Colonne latérale */}
          <aside className="space-y-6">
            {athlete?.club && (
              <section>
                <SectionTitle>Mon club</SectionTitle>
                <Link
                  href={`/athlete/clubs/${athlete.club.id}`}
                  className="flex items-center gap-3 rounded-lg bg-surface p-4 transition-colors hover:bg-surface-2"
                >
                  <ClubLogo club={athlete.club} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-white">{athlete.club.nom}</p>
                    <p className="text-[13px] text-muted">{athlete.club.ville}</p>
                  </div>
                  <ChevronRight className="size-5 text-muted" />
                </Link>
              </section>
            )}

            <Link
              href="/athlete/calendrier"
              className="flex items-center gap-3 rounded-lg bg-surface p-4 transition-colors hover:bg-surface-2"
            >
              <span className="grid size-10 place-items-center rounded-md bg-primary/12 text-primary">
                <CalendarDays className="size-5" />
              </span>
              <div className="flex-1">
                <p className="text-[15px] font-bold text-white">Mon Calendrier</p>
                <p className="text-xs text-muted">Voir mes événements par date</p>
              </div>
              <ChevronRight className="size-[18px] text-muted" />
            </Link>

            <section>
              <SectionTitle
                action={
                  <Link href="/athlete/evenements" className="text-[13px] font-semibold text-primary hover:underline">
                    Tout voir
                  </Link>
                }
              >
                Prochains événements
              </SectionTitle>
              {inscriptions.isLoading ? (
                <SkeletonList count={1} />
              ) : upcomingEvents.length === 0 ? (
                <div className="flex items-center gap-3 rounded-lg bg-surface p-4 text-sm text-muted">
                  <Trophy className="size-5 shrink-0" />
                  Aucun événement à venir pour le moment.
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((i) => (
                    <EventCard key={i.id} event={i.event} statut={i.statut} href={`/athlete/evenements/${i.event.id}`} />
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </PageContainer>
    </>
  );
}
