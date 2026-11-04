"use client";

import { useMyEventInscriptions } from "@/lib/hooks/events";
import { CalendarScreen } from "@/components/screens/calendar";

export default function AthleteCalendarPage() {
  const { data, isLoading, isError, refetch } = useMyEventInscriptions();
  return (
    <CalendarScreen
      title="Mon Calendrier"
      subtitle="Mes événements par date"
      backHref="/athlete"
      items={(data ?? []).map((i) => ({ id: i.id, event: i.event, statut: i.statut }))}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      hrefFor={(id) => `/athlete/evenements/${id}`}
    />
  );
}
