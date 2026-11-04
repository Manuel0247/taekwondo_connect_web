"use client";

import { useState } from "react";
import { CalendarDays, Trophy } from "lucide-react";
import { useMyEventInscriptions } from "@/lib/hooks/events";
import { INSCRIPTION_STATUS } from "@/lib/config";
import type { InscriptionStatut } from "@/lib/types";
import { IconAction, PageContainer, PageHeader } from "@/components/layout/page";
import { EmptyState, ErrorState, SkeletonList } from "@/components/ui/display";
import { Chip, ChipRow } from "@/components/ui/controls";
import { EventCard } from "@/components/domain/cards";

const FILTERS: Array<{ label: string; value?: InscriptionStatut }> = [
  { label: "Tous" },
  { label: "Proposés", value: "propose" },
  { label: "Confirmés", value: "confirme" },
  { label: "Refusés", value: "refuse" },
  { label: "Annulés", value: "annule" },
];

export default function AthleteEventsPage() {
  const [filter, setFilter] = useState<InscriptionStatut | undefined>();
  const { data, isLoading, isError, refetch } = useMyEventInscriptions();
  const raw = data ?? [];
  const list = (filter ? raw.filter((i) => i.statut === filter) : raw)
    .slice()
    .sort((a, b) => b.event.date_debut.localeCompare(a.event.date_debut));

  return (
    <>
      <PageHeader
        title="Mes Événements"
        subtitle={`Événements auxquels vous avez été proposé${raw.length ? ` (${raw.length})` : ""}`}
        actions={
          <IconAction href="/athlete/calendrier" label="Mon calendrier">
            <CalendarDays />
          </IconAction>
        }
      />
      <PageContainer className="mt-3 md:mt-0">
        <ChipRow className="mb-4">
          {FILTERS.map((f) => (
            <Chip key={f.label} active={filter === f.value} onClick={() => setFilter(f.value)}>
              {f.label}
              {f.value && raw.some((i) => i.statut === f.value) && (
                <span className="text-[11px] opacity-80">{raw.filter((i) => i.statut === f.value).length}</span>
              )}
            </Chip>
          ))}
        </ChipRow>

        {isLoading ? (
          <SkeletonList count={4} className="md:grid-cols-2 xl:grid-cols-3" />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : list.length === 0 ? (
          <EmptyState
            icon={Trophy}
            message={filter ? `Aucune inscription « ${INSCRIPTION_STATUS[filter].label} »` : "Vous n'avez pas encore été proposé à un événement"}
            description={filter ? undefined : "Votre maître de salle vous propose aux compétitions, stages et passages de grade."}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {list.map((i) => (
              <li key={i.id}>
                <EventCard event={i.event} statut={i.statut} href={`/athlete/evenements/${i.event.id}`} />
              </li>
            ))}
          </ul>
        )}
      </PageContainer>
    </>
  );
}
