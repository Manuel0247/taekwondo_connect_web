"use client";

import { Heart } from "lucide-react";
import { useFavoriteTechniques, useToggleFavorite } from "@/lib/hooks/techniques";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/display";
import { LinkButton } from "@/components/ui/button";
import { TechniqueCard } from "@/components/domain/cards";

export default function FavouritesPage() {
  const { data, isLoading, isError, refetch } = useFavoriteTechniques();
  const toggle = useToggleFavorite();
  // L'API renvoie { technique_id, technique } : on extrait la technique imbriquée
  const list = (data ?? []).filter((f) => f.technique).map((f) => ({ ...f.technique, est_favori: true }));

  return (
    <>
      <PageHeader title="Mes Favoris" subtitle={list.length ? `${list.length} technique${list.length > 1 ? "s" : ""}` : undefined} backHref="/athlete/techniques" />
      <PageContainer className="mt-4 md:mt-0">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-lg" />)}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : list.length === 0 ? (
          <EmptyState
            icon={Heart}
            message="Aucun favori pour l'instant"
            description="Touchez le cœur d'une technique pour la retrouver ici."
            action={<LinkButton href="/athlete/techniques" variant="outline" size="sm">Parcourir les techniques</LinkButton>}
          />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {list.map((t) => (
              <li key={t.id}>
                <TechniqueCard
                  technique={t}
                  href={`/athlete/techniques/${t.id}`}
                  favouriteBusy={toggle.isPending && toggle.variables?.id === t.id}
                  onFavourite={() => toggle.mutate({ id: t.id, isFavori: true })}
                />
              </li>
            ))}
          </ul>
        )}
      </PageContainer>
    </>
  );
}
