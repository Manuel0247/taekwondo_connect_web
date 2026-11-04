"use client";

import { Award } from "lucide-react";
import { useAthleteHistorique } from "@/lib/hooks/athletes";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { EmptyState, ErrorState, SkeletonList } from "@/components/ui/display";
import { GradeTimeline } from "@/components/domain/grades";

export default function GradesHistoryPage() {
  const { data, isLoading, isError, refetch } = useAthleteHistorique();
  // Du plus récent au plus ancien
  const items = [...(data?.grades ?? [])].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <PageHeader title="Historique des grades" backHref="/athlete/profil" size="md" />
      <PageContainer size="md" className="mt-4 md:mt-0">
        {isLoading ? (
          <SkeletonList count={3} />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : items.length === 0 ? (
          <EmptyState icon={Award} message="Aucun historique" />
        ) : (
          <GradeTimeline items={items} />
        )}
      </PageContainer>
    </>
  );
}
