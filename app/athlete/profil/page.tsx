"use client";

import Link from "next/link";
import {
  Award, Bell, CalendarCheck, ChevronRight, Heart, LogOut, Medal, Pencil, Shield, Trophy, UserCog,
} from "lucide-react";
import { useAthleteBadges, useAthleteClassement, useMyAthleteProfile } from "@/lib/hooks/athletes";
import { useMyReservations } from "@/lib/hooks/courses";
import { useMyEventInscriptions } from "@/lib/hooks/events";
import { useLogout } from "@/lib/hooks/auth";
import { formatDateTime } from "@/lib/format";
import { cn, fullName, storageUrl } from "@/lib/utils";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { Avatar, Card, ErrorState, GradeChip, SectionTitle, SkeletonList } from "@/components/ui/display";
import { useConfirm } from "@/components/ui/dialog";
import { GradeProgress } from "@/components/domain/grades";

const RANK_LABEL: Record<string, string> = { poids: "Poids", grade: "Grade", age: "Âge" };

export default function AthleteProfilePage() {
  const { data: athlete, isLoading, isError, refetch } = useMyAthleteProfile();
  const badges = useAthleteBadges();
  const ranking = useAthleteClassement();
  const reservations = useMyReservations();
  const inscriptions = useMyEventInscriptions();
  const logout = useLogout();
  const confirm = useConfirm();

  const name = fullName(athlete?.user ?? athlete);
  const badgeList = badges.data ?? [];
  const competitions =
    athlete?.nb_competitions ??
    (inscriptions.data ?? []).filter((i) => i.event.type === "competition" && i.statut === "confirme").length;
  const upcoming = (reservations.data ?? [])
    .filter((r) => (r.statut === "confirme" || r.statut === "liste_attente") && r.course && new Date(r.course.date_fin) >= new Date())
    .sort((a, b) => a.course!.date_debut.localeCompare(b.course!.date_debut))
    .slice(0, 4);

  const onLogout = async () => {
    if (await confirm({ title: "Déconnexion", message: "Voulez-vous vraiment vous déconnecter ?", confirmLabel: "Déconnecter", danger: true })) logout();
  };

  if (isLoading) return <SkeletonList count={3} className="p-4 md:p-8" />;
  if (isError || !athlete) return <ErrorState onRetry={() => refetch()} className="pt-16" />;

  return (
    <>
      <PageHeader title="Profil" />
      <PageContainer className="mt-4 grid grid-cols-1 gap-6 md:mt-0 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* Colonne identité + menu */}
        <div className="space-y-5">
          <Card className="flex flex-col items-center p-6 text-center">
            <Avatar src={athlete.user?.photo_url ?? athlete.photo_url} name={name} size={88} />
            <p className="mt-3 text-xl font-extrabold text-white">{name}</p>
            <p className="text-sm text-muted">{athlete.user?.email ?? athlete.email}</p>
            <GradeChip grade={athlete.grade} className="mt-3" />
            <div className="mt-5 w-full border-t border-line pt-4">
              <p className="mb-1 text-left text-xs font-bold tracking-wide text-muted uppercase">Progression</p>
              <GradeProgress current={athlete.grade} />
            </div>
          </Card>

          <nav aria-label="Paramètres du profil">
            <SectionTitle>Paramètres</SectionTitle>
            <Card className="divide-y divide-line p-0">
              <MenuLink href="/athlete/profil/modifier" icon={<Pencil />} label="Modifier le profil" />
              <MenuLink href="/athlete/profil/compte" icon={<UserCog />} label="Mon compte et mot de passe" />
              <MenuLink href="/athlete/profil/notifications" icon={<Bell />} label="Préférences notifications" />
              <MenuLink href="/athlete/profil/grades" icon={<Award />} label="Historique des grades" />
              <MenuLink href="/athlete/techniques/favoris" icon={<Heart />} label="Mes techniques favorites" />
              <button type="button" onClick={onLogout} className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] font-medium text-[#f87171] hover:bg-danger/10">
                <LogOut className="size-5" /> Se déconnecter
              </button>
            </Card>
          </nav>
        </div>

        {/* Colonne activité */}
        <div className="min-w-0 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <Stat icon={<Shield />} label="Club" value={athlete.club?.nom ?? "—"} href={athlete.club ? `/athlete/clubs/${athlete.club.id}` : "/athlete/clubs"} />
            <Stat icon={<Trophy />} label="Compétitions" value={String(competitions)} />
            <Stat icon={<Medal />} label="Badges" value={String(badgeList.length)} />
          </div>

          {(ranking.data ?? []).length > 0 && (
            <section>
              <SectionTitle>Mon classement</SectionTitle>
              <div className="grid grid-cols-3 gap-3">
                {ranking.data!.slice(0, 3).map((r) => (
                  <Card key={`${r.categorie}-${r.valeur_categorie}`} className="text-center">
                    <p className="text-2xl font-extrabold text-primary">#{r.position}</p>
                    <p className="mt-1 text-xs font-semibold text-white">{RANK_LABEL[r.categorie] ?? r.categorie}</p>
                    <p className="truncate text-xs text-muted capitalize">{r.valeur_categorie}</p>
                    <p className="mt-1 text-[11px] text-secondary-light">{r.points} pts · {r.saison}</p>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <section>
            <SectionTitle>Mes badges</SectionTitle>
            {badgeList.length === 0 ? (
              <p className="rounded-lg bg-surface p-4 text-sm text-muted">Aucun badge pour le moment.</p>
            ) : (
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-6">
                {badgeList.map((b) => {
                  const badge = b.badge;
                  const label = badge?.nom ?? b.nom ?? "Badge";
                  const icon = storageUrl(badge?.icone_url ?? b.icone_url);
                  return (
                    <li key={b.id} className="flex flex-col items-center rounded-lg bg-surface p-3 text-center" title={badge?.description ?? b.contexte ?? undefined}>
                      {icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={icon} alt="" className="size-10 object-contain" />
                      ) : (
                        <Medal className="size-8 text-primary" strokeWidth={1.6} />
                      )}
                      <p className="mt-2 line-clamp-2 text-xs font-semibold text-white">{label}</p>
                      {b.contexte && <p className="mt-0.5 line-clamp-1 text-[10px] text-muted">{b.contexte}</p>}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <SectionTitle>Mes réservations à venir</SectionTitle>
            {upcoming.length === 0 ? (
              <p className="rounded-lg bg-surface p-4 text-sm text-muted">Aucune réservation à venir.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {upcoming.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 rounded-md bg-surface p-3.5">
                    <span className={cn("grid size-10 place-items-center rounded-md", r.statut === "confirme" ? "bg-secondary/20 text-secondary-light" : "bg-warning/15 text-warning")}>
                      <CalendarCheck className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{r.course!.titre}</p>
                      <p className="text-xs text-muted">
                        {formatDateTime(r.course!.date_debut)}
                        {r.statut === "liste_attente" && ` · Liste d'attente${r.position_attente ? ` #${r.position_attente}` : ""}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </PageContainer>
    </>
  );
}

function Stat({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const body = (
    <>
      <span className="text-primary [&_svg]:size-[22px]">{icon}</span>
      <p className="mt-2 w-full truncate text-[15px] font-extrabold text-white">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </>
  );
  const cls = "flex flex-col items-center rounded-lg bg-surface p-3 text-center sm:p-4";
  return href ? <Link href={href} className={cn(cls, "hover:bg-surface-2")}>{body}</Link> : <div className={cls}>{body}</div>;
}

function MenuLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-white/5">
      <span className="text-muted [&_svg]:size-5">{icon}</span>
      <span className="flex-1">{label}</span>
      <ChevronRight className="size-[18px] text-line" />
    </Link>
  );
}
