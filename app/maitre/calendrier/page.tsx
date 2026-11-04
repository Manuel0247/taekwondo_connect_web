"use client";

import { useEvents } from "@/lib/hooks/events";
import { CalendarScreen } from "@/components/screens/calendar";

export default function MaitreCalendarPage() {
  // Tous les événements publiés de la ligue (filtrés par mois côté client)
  const { data, isLoading, isError, refetch } = useEvents({ limit: 100, statut: "publie" });
  return (
    <CalendarScreen
      title="Calendrier"
      subtitle="Tous les événements de la ligue"
      backHref="/maitre"
      accent="secondary"
      items={(data ?? []).map((e) => ({ id: e.id, event: e }))}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      hrefFor={(id) => `/maitre/evenements/${id}`}
    />
  );
}
