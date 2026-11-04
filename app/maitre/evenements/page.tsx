"use client";

import { useState } from "react";
import { CalendarRange, Trophy } from "lucide-react";
import { useEvents } from "@/lib/hooks/events";
import type { EventType } from "@/lib/types";
import { IconAction, PageContainer, PageHeader } from "@/components/layout/page";
import { EmptyState, ErrorState, SkeletonList } from "@/components/ui/display";
import { Chip, ChipRow } from "@/components/ui/controls";
import { EventCard } from "@/components/domain/cards";

const FILTERS: Array<{ label: string; value?: EventType }> = [
  { label: "Tous" },
  { label: "Compétition", value: "competition" },
  { label: "Passage grade", value: "passage_grade" },
  { label: "Stage", value: "stage" },
  { label: "Cours spécial", value: "cours_special" },
];

export default function MaitreEventsPage() {
  const [type, setType] = useState<EventType | undefined>();
  const { data, isLoading, isError, refetch } = useEvents({ type, statut: "publie" });
  const list = (data ?? []).slice().sort((a, b) => a.date_debut.localeCompare(b.date_debut));

  return (
    <>
      <PageHeader
        title="Événements"
        subtitle="Proposez vos athlètes aux compétitions et stages"
        actions={
          <IconAction href="/maitre/calendrier" label="Calendrier">
            <CalendarRange />
          </IconAction>
        }
      />
      <PageContainer className="mt-3 md:mt-0">
        <ChipRow className="mb-4">
          {FILTERS.map((f) => (
            <Chip key={f.label} color="secondary" active={type === f.value} onClick={() => setType(f.value)}>
              {f.label}
            </Chip>
          ))}
        </ChipRow>
        {isLoading ? (
          <SkeletonList count={4} className="md:grid-cols-2 xl:grid-cols-3" />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : list.length === 0 ? (
          <EmptyState icon={Trophy} message="Aucun événement disponible" />
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {list.map((e) => (
              <li key={e.id}>
                <EventCard event={e} href={`/maitre/evenements/${e.id}`} showPlaces />
              </li>
            ))}
          </ul>
        )}
      </PageContainer>
    </>
  );
}
