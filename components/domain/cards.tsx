"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Banknote, Calendar, ChevronRight, Clock, Heart, MapPin, Plus, Repeat, Shield, Hourglass, CheckCircle2, PersonStanding,
} from "lucide-react";
import { cn, formatPrice, fullName, storageUrl } from "@/lib/utils";
import { formatDate, formatRelative, formatShortDate, formatTime, formatDateTime } from "@/lib/format";
import {
  CLUB_STATUS, COURSE_LEVELS, EVENT_TYPES, INSCRIPTION_STATUS, formatJours,
} from "@/lib/config";
import type {
  AppNotification, Athlete, Club, Course, EventType, InscriptionStatut, LeagueEvent, Technique,
} from "@/lib/types";
import { Avatar, Badge, GradeChip } from "../ui/display";
import { Spinner } from "../ui/spinner";

const cardBase =
  "group block rounded-lg bg-surface transition-[background-color,transform,box-shadow] duration-150 hover:bg-surface-2 focus-visible:bg-surface-2";

// ── Club ────────────────────────────────────────────────────────────────────

export function ClubLogo({ club, size = 52, className }: { club: Pick<Club, "logo_url" | "nom">; size?: number; className?: string }) {
  const url = storageUrl(club.logo_url);
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element -- fichier servi par l'API
    <img src={url} alt={`Logo ${club.nom}`} className={cn("shrink-0 rounded-md object-cover", className)} style={{ width: size, height: size }} />
  ) : (
    <span className={cn("grid shrink-0 place-items-center rounded-md bg-primary/12 text-primary", className)} style={{ width: size, height: size }}>
      <Shield style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={1.7} />
    </span>
  );
}

export function ClubCard({
  club, href, active, onHover,
}: {
  club: Club; href: string; active?: boolean; onHover?: (id: string | null) => void;
}) {
  const status = CLUB_STATUS[club.statut] ?? CLUB_STATUS.en_attente;
  const price = formatPrice(club.prix_mensuel);
  return (
    <Link
      href={href}
      onMouseEnter={() => onHover?.(club.id)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(club.id)}
      className={cn(cardBase, "p-3.5", active && "bg-surface-2 ring-1 ring-primary/60")}
    >
      <div className="flex items-center gap-3">
        <ClubLogo club={club} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-white">{club.nom}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{club.ville}</span>
          </p>
          {price && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
              <Banknote className="size-3.5 shrink-0" />
              {price}/mois
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge label={status.label} color={status.color} size="sm" />
          {club.distance !== undefined && <span className="text-xs font-semibold text-primary">{club.distance.toFixed(1)} km</span>}
        </div>
      </div>
    </Link>
  );
}

// ── Cours ───────────────────────────────────────────────────────────────────

function CourseMeta({ course }: { course: Course }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
      <span className="inline-flex items-center gap-1">
        <Calendar className="size-3.5" />
        {formatDate(course.date_debut)}
      </span>
      <span className="inline-flex items-center gap-1">
        <Clock className="size-3.5" />
        {formatTime(course.date_debut)} – {formatTime(course.date_fin)}
      </span>
    </div>
  );
}

/** Carte cours côté maître (CourseCard.tsx) */
export function CourseCard({ course, href, trailing }: { course: Course; href: string; trailing?: ReactNode }) {
  const niveau = COURSE_LEVELS[course.niveau] ?? COURSE_LEVELS.tous;
  const jours = course.est_recurrent ? formatJours(course.jours_recurrence) : "";
  const taken = course.places_total - (course.places_disponibles ?? course.places_total);
  return (
    <div className={cn(cardBase, "relative p-3.5")}>
      <Link href={href} className="absolute inset-0 rounded-lg" aria-label={`Réservations du cours ${course.titre}`} />
      <div className="mb-2 flex items-center justify-between gap-2">
        <Badge label={niveau.label} color={niveau.color} size="sm" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted" title="Places disponibles / total">
            {course.places_disponibles ?? "—"}/{course.places_total}
          </span>
          {trailing && <div className="relative z-10">{trailing}</div>}
        </div>
      </div>
      <p className="mb-2 truncate text-[15px] font-bold text-white">{course.titre}</p>
      <CourseMeta course={course} />
      {jours && (
        <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-secondary-light">
          <Repeat className="size-3.5" />
          {jours}
        </p>
      )}
      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-secondary-light" style={{ width: `${course.places_total ? (taken / course.places_total) * 100 : 0}%` }} />
        </div>
        <span className="text-[11px] text-muted">{taken} réservé{taken > 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}

/** Cours réservable côté athlète (CourseItem de l'accueil mobile) */
export function ReservableCourse({
  course, statut, onReserve, reserving, onCancel, cancelling,
}: {
  course: Course;
  statut?: "confirme" | "liste_attente";
  onReserve: () => void;
  reserving: boolean;
  onCancel: () => void;
  cancelling: boolean;
}) {
  const niveau = COURSE_LEVELS[course.niveau] ?? COURSE_LEVELS.tous;
  const dispo = course.places_disponibles ?? -1;
  const full = dispo === 0;
  const waiting = statut === "liste_attente";
  return (
    <div className="flex flex-col rounded-lg bg-surface p-3.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Badge label={niveau.label} color={niveau.color} tone="soft" size="sm" />
        <span className={cn("text-xs font-semibold", full ? "text-[#f87171]" : "text-secondary-light")}>
          {full ? "Complet" : dispo > 0 ? `${dispo} place${dispo > 1 ? "s" : ""}` : ""}
        </span>
      </div>
      <p className="mb-2 truncate text-[15px] font-bold text-white">{course.titre}</p>
      <CourseMeta course={course} />
      <div className="mt-auto pt-3">
        {statut ? (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex flex-1 items-center gap-1.5 rounded-sm px-3 py-2 text-[13px] font-bold",
                waiting ? "bg-warning/15 text-warning" : "bg-secondary/20 text-secondary-light",
              )}
            >
              {waiting ? <Hourglass className="size-4" /> : <CheckCircle2 className="size-4" />}
              {waiting ? "Liste d'attente" : "Réservé"}
            </span>
            <button
              type="button"
              onClick={onCancel}
              disabled={cancelling}
              className="inline-flex h-9 items-center rounded-sm border border-danger/50 px-3 text-[13px] font-semibold text-[#f87171] hover:bg-danger/10 disabled:opacity-60"
            >
              {cancelling ? <Spinner className="size-4" /> : "Annuler"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onReserve}
            disabled={full || reserving}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-sm bg-primary text-[13px] font-bold text-white transition-colors hover:bg-[#d65c08] disabled:bg-line disabled:text-muted"
          >
            {reserving ? <Spinner className="size-4" /> : (
              <>
                <Plus className="size-4" />
                {full ? "Complet" : "Réserver"}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Événements ──────────────────────────────────────────────────────────────

export function EventBadge({ type, size = "sm", tone = "solid" }: { type: EventType; size?: "sm" | "md"; tone?: "solid" | "soft" }) {
  const cfg = EVENT_TYPES[type] ?? EVENT_TYPES.competition;
  return <Badge label={cfg.label} color={cfg.color} size={size} tone={tone} />;
}

export function InscriptionBadge({ statut }: { statut: InscriptionStatut }) {
  const cfg = INSCRIPTION_STATUS[statut] ?? INSCRIPTION_STATUS.en_attente;
  return <Badge label={cfg.label} color={cfg.color} tone="soft" size="sm" />;
}

/** Carte événement avec liseré coloré par type (EventCard.tsx) */
export function EventCard({
  event, href, statut, showPlaces,
}: {
  event: LeagueEvent; href: string; statut?: InscriptionStatut; showPlaces?: boolean;
}) {
  const color = (EVENT_TYPES[event.type] ?? EVENT_TYPES.competition).color;
  const places = event.places_disponibles ?? -1;
  return (
    <Link href={href} className={cn(cardBase, "flex overflow-hidden")}>
      <span className="w-1 shrink-0" style={{ backgroundColor: color }} />
      <div className="min-w-0 flex-1 p-3.5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <EventBadge type={event.type} tone="soft" />
          {statut && <InscriptionBadge statut={statut} />}
          {showPlaces && !statut && (
            <span className={cn("text-xs font-semibold", places === 0 ? "text-[#f87171]" : "text-secondary-light")}>
              {places === 0 ? "Complet" : places > 0 ? `${places} places` : ""}
            </span>
          )}
        </div>
        <p className="line-clamp-2 text-[15px] font-bold text-white">{event.titre}</p>
        <div className="mt-2 space-y-1 text-xs text-muted">
          <p className="flex items-center gap-1.5">
            <Calendar className="size-3.5 shrink-0" />
            {formatDateTime(event.date_debut)}
          </p>
          {event.adresse && (
            <p className="flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{event.adresse}</span>
            </p>
          )}
        </div>
      </div>
      <ChevronRight className="mr-3 size-[18px] shrink-0 self-center text-muted transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

// ── Techniques ──────────────────────────────────────────────────────────────

const TECH_LEVELS = {
  debutant: COURSE_LEVELS.debutant,
  intermediaire: COURSE_LEVELS.intermediaire,
  avance: COURSE_LEVELS.avance,
};

export function TechniqueCard({
  technique, href, onFavourite, favouriteBusy,
}: {
  technique: Technique; href: string; onFavourite: () => void; favouriteBusy?: boolean;
}) {
  const niveau = TECH_LEVELS[technique.niveau] ?? TECH_LEVELS.debutant;
  const img = storageUrl(technique.illustration_url);
  return (
    <div className={cn(cardBase, "relative overflow-hidden")}>
      <Link href={href} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-line">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element -- fichier servi par l'API
            <img src={img} alt="" loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
          ) : (
            <div className="grid size-full place-items-center text-muted">
              <PersonStanding className="size-10" strokeWidth={1.5} />
            </div>
          )}
        </div>
        <div className="p-3">
          <Badge label={niveau.label} color={niveau.color} size="sm" />
          <p className="mt-2 line-clamp-2 pr-1 text-[13px] font-bold text-white sm:text-sm">{technique.nom_fr}</p>
          {technique.nom_korean && <p className="mt-0.5 truncate text-[11px] text-muted sm:text-xs">{technique.nom_korean}</p>}
        </div>
      </Link>
      <button
        type="button"
        onClick={onFavourite}
        disabled={favouriteBusy}
        aria-pressed={!!technique.est_favori}
        aria-label={technique.est_favori ? `Retirer ${technique.nom_fr} des favoris` : `Ajouter ${technique.nom_fr} aux favoris`}
        className="absolute top-2 right-2 grid size-9 place-items-center rounded-full bg-ink/70 backdrop-blur transition-transform hover:scale-110 disabled:opacity-60"
      >
        <Heart className={cn("size-[18px]", technique.est_favori ? "fill-danger text-danger" : "text-white")} />
      </button>
    </div>
  );
}

// ── Notifications ───────────────────────────────────────────────────────────

export function NotificationItem({ notification, onOpen, busy }: { notification: AppNotification; onOpen: () => void; busy?: boolean }) {
  const unread = !notification.est_lue;
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={busy}
      className={cn(
        "flex w-full gap-3 rounded-md bg-surface p-3.5 text-left transition-colors hover:bg-surface-2",
        unread && "border-l-[3px] border-primary",
      )}
    >
      <span className="w-2 shrink-0 pt-1.5">{unread && <span className="block size-2 rounded-full bg-primary" aria-label="Non lue" />}</span>
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate text-sm font-bold", unread ? "text-white" : "text-white/80")}>{notification.titre}</span>
        <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-muted">{notification.message}</span>
        <span className="mt-1 block text-[11px] text-muted/70">{formatRelative(notification.created_at)}</span>
      </span>
      {busy && <Spinner className="size-4 text-primary" />}
    </button>
  );
}

// ── Athlètes ────────────────────────────────────────────────────────────────

export function athleteName(a?: Athlete | null) {
  return fullName(a?.user ?? a) || "Athlète";
}

export function AthleteRow({
  athlete, href, showDate, trailing, className,
}: {
  athlete: Athlete; href?: string; showDate?: boolean; trailing?: ReactNode; className?: string;
}) {
  const name = athleteName(athlete);
  const inner = (
    <>
      <Avatar src={athlete.user?.photo_url ?? athlete.photo_url} name={name} size={44} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-white">{name}</p>
        {showDate && athlete.created_at && <p className="mt-0.5 text-xs text-muted">Inscrit le {formatShortDate(athlete.created_at)}</p>}
      </div>
      <GradeChip grade={athlete.grade} />
      {trailing}
      {href && <ChevronRight className="size-4 shrink-0 text-muted" />}
    </>
  );
  return href ? (
    <Link href={href} className={cn(cardBase, "flex items-center gap-3 rounded-md p-3", className)}>
      {inner}
    </Link>
  ) : (
    <div className={cn("flex items-center gap-3 rounded-md bg-surface p-3", className)}>{inner}</div>
  );
}

// ── Statistiques ────────────────────────────────────────────────────────────

export function StatCard({
  icon, value, label, color, href,
}: {
  icon: ReactNode; value: ReactNode; label: string; color: string; href?: string;
}) {
  const body = (
    <>
      <span className="grid size-10 place-items-center rounded-md [&_svg]:size-5" style={{ backgroundColor: `${color}22`, color }}>
        {icon}
      </span>
      <p className="mt-3 truncate text-2xl font-extrabold text-white">{value}</p>
      <p className="text-xs font-medium text-muted">{label}</p>
    </>
  );
  const cls = "block rounded-lg border-t-[3px] bg-surface p-4 transition-colors";
  return href ? (
    <Link href={href} className={cn(cls, "hover:bg-surface-2")} style={{ borderTopColor: color }}>
      {body}
    </Link>
  ) : (
    <div className={cls} style={{ borderTopColor: color }}>
      {body}
    </div>
  );
}
