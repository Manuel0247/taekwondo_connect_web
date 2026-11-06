"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, ExternalLink, FileText, Image as ImageIcon, MapPin, X } from "lucide-react";
import { useClubDetail } from "@/lib/hooks/clubs";
import { useJoinClub, useMyAthleteProfile } from "@/lib/hooks/athletes";
import { useCancelReservation, useClubCourses, useMyReservations, useReserveCourse } from "@/lib/hooks/courses";
import { DISCIPLINE_LABELS, JOURS } from "@/lib/config";
import { capitalize, formatPrice, storageUrl, toNumber } from "@/lib/utils";
import type { Course, Discipline } from "@/lib/types";
import { PageContainer } from "@/components/layout/page";
import { Card, ErrorState, GradeChip, SectionTitle, SkeletonList, Tag } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/dialog";
import { ClubLogo, ReservableCourse } from "@/components/domain/cards";
import { LocationMap } from "@/components/maps";

export function ClubDetail({ id }: { id: string }) {
  const { data: club, isLoading, isError, refetch } = useClubDetail(id);
  const { data: athlete } = useMyAthleteProfile();
  const join = useJoinClub();
  const [lightbox, setLightbox] = useState<string | null>(null);

  const isThisClub = athlete?.club_id === id;
  const isPending = isThisClub && athlete?.statut_club === "en_attente";
  const isMember = isThisClub && athlete?.statut_club === "valide";
  const otherClub = !!athlete?.club_id && !isThisClub;

  if (isLoading) return <SkeletonList count={3} className="p-4 md:p-8" />;
  if (isError || !club) {
    return (
      <PageContainer className="pt-8">
        <ErrorState message="Club introuvable" onRetry={() => refetch()} />
      </PageContainer>
    );
  }

  const photos = (club.photos_urls ?? []).map((p) => storageUrl(p)).filter(Boolean) as string[];
  const hero = photos[0] ?? storageUrl(club.logo_url);
  const horaires = JOURS.filter((j) => club.horaires?.[j]);
  const lat = toNumber(club.latitude);
  const lng = toNumber(club.longitude);
  const docs = club.documents_urls ?? [];
  const mensuel = formatPrice(club.prix_mensuel);
  const annuel = formatPrice(club.prix_annuel);

  const joinBlock = isMember ? (
    <div className="flex items-center gap-2.5 rounded-md bg-secondary/15 p-4 text-sm font-bold text-secondary-light">
      <CheckCircle2 className="size-5" /> Vous êtes membre de ce club
    </div>
  ) : isPending ? (
    <div className="flex items-start gap-3 rounded-md bg-primary/12 p-4">
      <Clock className="mt-0.5 size-5 shrink-0 text-primary" />
      <div>
        <p className="text-sm font-bold text-primary">Demande en attente</p>
        <p className="text-xs text-muted">Le maître de salle doit valider votre inscription</p>
      </div>
    </div>
  ) : (
    <Button size="lg" fullWidth loading={join.isPending} disabled={otherClub} onClick={() => join.mutate(id)}>
      {otherClub ? "Déjà inscrit dans un autre club" : "Rejoindre ce club"}
    </Button>
  );

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="relative h-56 w-full overflow-hidden bg-surface sm:h-72 lg:mx-8 lg:mt-8 lg:h-80 lg:w-auto lg:rounded-xl">
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element -- fichier servi par l'API
          <img src={hero} alt="" className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(232,101,10,0.18),transparent_60%)]">
            <ClubLogo club={club} size={96} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
        <Link
          href="/athlete/clubs"
          className="absolute top-[calc(env(safe-area-inset-top)+1rem)] left-4 grid size-10 place-items-center rounded-full bg-ink/70 text-white backdrop-blur hover:bg-ink"
          aria-label="Retour aux clubs"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-4 sm:p-6">
          <ClubLogo club={club} size={64} className="hidden border-2 border-ink sm:grid" />
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl">{club.nom}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/80">
              <MapPin className="size-4 shrink-0" />
              <span className="truncate">
                {club.adresse}, {club.ville}
              </span>
            </p>
          </div>
        </div>
      </div>

      <PageContainer className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-7">
          {club.maitre_salle && (
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
              Maître : <span className="font-bold text-white">{club.maitre_salle.prenom} {club.maitre_salle.nom}</span>
              {club.maitre_salle.grade && <GradeChip grade={club.maitre_salle.grade} dan={club.maitre_salle.dan} />}
            </p>
          )}
          {club.description && <p className="text-[15px] leading-relaxed text-white/85">{club.description}</p>}

          {!!club.disciplines?.length && (
            <div className="flex flex-wrap gap-2">
              {club.disciplines.map((d) => (
                <Tag key={d} label={DISCIPLINE_LABELS[d as Discipline] ?? d} color="#F5A05C" />
              ))}
            </div>
          )}

          {photos.length > 0 && (
            <section>
              <SectionTitle>Photos de la salle</SectionTitle>
              <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0">
                {photos.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setLightbox(p)}
                    className="aspect-[4/3] w-60 shrink-0 overflow-hidden rounded-md sm:w-auto"
                    aria-label="Agrandir la photo"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p} alt="" className="size-full object-cover transition-transform hover:scale-105" />
                  </button>
                ))}
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {horaires.length > 0 && (
              <section>
                <SectionTitle>Horaires</SectionTitle>
                <Card className="divide-y divide-line p-0">
                  {horaires.map((j) => (
                    <div key={j} className="flex justify-between px-4 py-2.5 text-sm">
                      <span className="text-muted">{capitalize(j)}</span>
                      <span className="font-semibold text-white">{club.horaires![j]}</span>
                    </div>
                  ))}
                </Card>
              </section>
            )}
            {!!club.equipements?.length && (
              <section>
                <SectionTitle>Équipements</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {club.equipements.map((e) => (
                    <Tag key={e} label={capitalize(e)} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {docs.length > 0 && (
            <section>
              <SectionTitle>Documents</SectionTitle>
              <ul className="space-y-2">
                {docs.map((path) => {
                  const pdf = path.toLowerCase().endsWith(".pdf");
                  return (
                    <li key={path}>
                      <a
                        href={storageUrl(path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-md bg-surface p-3 transition-colors hover:bg-surface-2"
                      >
                        <span className="grid size-10 place-items-center rounded-sm bg-primary/12 text-primary">
                          {pdf ? <FileText className="size-5" /> : <ImageIcon className="size-5" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-white">{path.split("/").pop()}</span>
                          <span className="text-xs text-muted">{pdf ? "PDF" : "Image"} · Ouvrir dans un nouvel onglet</span>
                        </span>
                        <ExternalLink className="size-4 text-muted" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {isMember && <MemberCourses clubId={id} />}
        </div>

        {/* Colonne latérale : tarifs, adhésion, carte */}
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          {(mensuel || annuel) && (
            <div className="grid grid-cols-2 gap-3">
              {mensuel && (
                <Card className="text-center">
                  <p className="text-xs text-muted">Mensuel</p>
                  <p className="mt-1 text-lg font-extrabold text-primary">{mensuel}</p>
                </Card>
              )}
              {annuel && (
                <Card className="text-center">
                  <p className="text-xs text-muted">Annuel</p>
                  <p className="mt-1 text-lg font-extrabold text-primary">{annuel}</p>
                </Card>
              )}
            </div>
          )}
          {joinBlock}
          {lat !== null && lng !== null && (
            <section>
              <SectionTitle>Localisation</SectionTitle>
              <LocationMap latitude={lat} longitude={lng} title={club.nom} className="h-56 sm:h-64" />
            </section>
          )}
        </aside>
      </PageContainer>

      {/* Visionneuse photo */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[1000] grid place-items-center bg-black/95 p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Photo"
          onClick={() => setLightbox(null)}
          onKeyDown={(e) => e.key === "Escape" && setLightbox(null)}
        >
          <button type="button" autoFocus className="absolute top-4 right-4 grid size-11 place-items-center rounded-full bg-white/10 text-white" aria-label="Fermer">
            <X className="size-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-h-[85dvh] max-w-full rounded-md object-contain" />
        </div>
      )}
    </div>
  );
}

function MemberCourses({ clubId }: { clubId: string }) {
  const courses = useClubCourses(clubId);
  const reservations = useMyReservations();
  const reserve = useReserveCourse();
  const cancel = useCancelReservation();
  const confirm = useConfirm();
  const reserved = new Map<string, "confirme" | "liste_attente">();
  (reservations.data ?? []).forEach((r) => {
    if (r.course?.id && (r.statut === "confirme" || r.statut === "liste_attente")) reserved.set(r.course.id, r.statut);
  });
  const onCancel = async (c: Course) => {
    if (await confirm({ title: "Annuler la réservation", message: `Libérer votre place pour « ${c.titre} » ?`, confirmLabel: "Annuler la réservation", cancelLabel: "Garder", danger: true })) {
      cancel.mutate(c.id);
    }
  };
  if (courses.isLoading) return <SkeletonList count={2} />;
  if (!courses.data?.length) return null;
  return (
    <section>
      <SectionTitle>Cours à venir</SectionTitle>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {courses.data.map((c) => (
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
    </section>
  );
}
