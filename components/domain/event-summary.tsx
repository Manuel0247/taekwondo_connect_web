"use client";

import type { ReactNode } from "react";
import { Calendar, CalendarCheck, Clock, MapPin, Users, Wallet } from "lucide-react";
import { EVENT_TYPES, GRADE_SHORT, TARIF_GRADES, danLabel, tarifPourGrade } from "@/lib/config";
import { formatDate, formatDateTime, formatFcfa } from "@/lib/format";
import { toNumber } from "@/lib/utils";
import type { Grade, LeagueEvent } from "@/lib/types";
import { Card, InfoRow, ProgressBar, SectionTitle } from "../ui/display";
import { LocationMap } from "../maps";
import { EventBadge } from "./cards";

const STATUT_LABEL: Record<LeagueEvent["statut"], string> = {
  brouillon: "Brouillon",
  publie: "Publié",
  annule: "Annulé",
  termine: "Terminé",
};

/** Participation : montant fixe, ou celui du grade donné (athlète) ; null = gratuit / non défini */
function tarifTexte(event: LeagueEvent, grade?: Grade | null, dan?: number | null): string {
  if (event.tarif_type !== "variable") return event.prix ? formatFcfa(event.prix) : "Gratuit";
  const prix = tarifPourGrade(event.prix_par_grade, grade, dan);
  return prix ? `${formatFcfa(prix)} (ceinture ${GRADE_SHORT[grade!].toLowerCase()})` : "Selon le grade";
}

/** Bloc d'informations d'un événement (EventDetailScreen du mobile) */
export function EventSummary({ event, grade, dan, children }: { event: LeagueEvent; grade?: Grade | null; dan?: number | null; children?: ReactNode }) {
  const color = (EVENT_TYPES[event.type] ?? EVENT_TYPES.competition).color;
  const dispo = event.places_disponibles;
  const taken = dispo === null ? 0 : event.places_total - dispo;
  const lat = toNumber(event.latitude);
  const lng = toNumber(event.longitude);

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <EventBadge type={event.type} size="md" />
          {event.statut !== "publie" && (
            <span className="rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-muted">{STATUT_LABEL[event.statut]}</span>
          )}
        </div>
        <h1 className="text-2xl leading-tight font-extrabold text-white md:text-[32px]">{event.titre}</h1>
        {event.description && <p className="mt-3 text-[15px] leading-relaxed text-white/80">{event.description}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-l-4 py-2" style={{ borderLeftColor: color }}>
          <InfoRow icon={<Calendar />} label="Début" value={formatDateTime(event.date_debut)} />
          <InfoRow icon={<CalendarCheck />} label="Fin" value={formatDateTime(event.date_fin)} />
          <InfoRow icon={<MapPin />} label="Lieu" value={event.adresse} />
          {event.date_limite_inscription && (
            <InfoRow icon={<Clock />} label="Date limite d'inscription" value={formatDate(event.date_limite_inscription)} />
          )}
          {event.organisateur && <InfoRow icon={<Users />} label="Organisateur" value={event.organisateur} />}
          <InfoRow icon={<Wallet />} label="Participation" value={tarifTexte(event, grade, dan)} />
          {/* Sans grade connu (maître), on détaille le tarif de chaque grade */}
          {event.tarif_type === "variable" && !grade && (
            <div className="flex flex-wrap gap-1.5 pb-2 pl-9">
              {TARIF_GRADES.filter((g) => event.prix_par_grade?.[g.key] != null).map((g) => (
                <span key={g.key} className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-white/80">
                  {GRADE_SHORT[g.grade]}{g.dan ? ` ${danLabel(g.dan)}` : ""} · {formatFcfa(event.prix_par_grade![g.key]!)}
                </span>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="mb-3 flex items-baseline justify-between">
              <p className="text-sm text-muted">Places disponibles</p>
              <p className="text-sm text-muted">
                <span className="text-xl font-extrabold text-primary">{dispo ?? "—"}</span> / {event.places_total}
              </p>
            </div>
            <ProgressBar value={event.places_total > 0 ? taken / event.places_total : 0} color={color} />
          </Card>
          {children}
        </div>
      </div>

      {lat !== null && lng !== null && (
        <section>
          <SectionTitle>Localisation</SectionTitle>
          <LocationMap latitude={lat} longitude={lng} title={event.adresse} className="h-60 md:h-72" />
        </section>
      )}
    </div>
  );
}
