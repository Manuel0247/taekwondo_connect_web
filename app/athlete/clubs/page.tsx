"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, Info, List, Map as MapIcon, Search, SlidersHorizontal, X } from "lucide-react";
import { useClubs } from "@/lib/hooks/clubs";
import { DISCIPLINE_LABELS } from "@/lib/config";
import { cn, toNumber } from "@/lib/utils";
import type { Discipline } from "@/lib/types";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { EmptyState, ErrorState, SkeletonList } from "@/components/ui/display";
import { Chip, Segmented } from "@/components/ui/controls";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ClubCard } from "@/components/domain/cards";
import { ClubsMap, type MapClub } from "@/components/maps";

function useDebounced<T>(value: T, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function ClubsPage() {
  const [search, setSearch] = useState("");
  const [ville, setVille] = useState("");
  const [discipline, setDiscipline] = useState<Discipline | "">("");
  const [prixMax, setPrixMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");
  const [focusId, setFocusId] = useState<string | null>(null);

  const filters = {
    q: useDebounced(search.trim()) || undefined,
    ville: useDebounced(ville.trim()) || undefined,
    discipline: discipline || undefined,
    prix_max: toNumber(useDebounced(prixMax)) ?? undefined,
  };
  const activeFilters = [filters.ville, filters.discipline, filters.prix_max].filter(Boolean).length;

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useClubs(filters);
  const clubs = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const total = data?.pages[0]?.total ?? clubs.length;

  // Coordonnées renvoyées parfois en texte : conversion avant la carte
  const mapped: MapClub[] = useMemo(
    () =>
      clubs.flatMap((c) => {
        const lat = toNumber(c.latitude);
        const lng = toNumber(c.longitude);
        return lat === null || lng === null ? [] : [{ id: c.id, nom: c.nom, ville: c.ville, prix_mensuel: c.prix_mensuel, latitude: lat, longitude: lng }];
      }),
    [clubs],
  );

  // Pagination infinie : chargement automatique en bas de liste
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const resetFilters = () => {
    setVille("");
    setDiscipline("");
    setPrixMax("");
  };

  const list = (
    <>
      {isLoading ? (
        <SkeletonList count={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : clubs.length === 0 ? (
        <EmptyState
          icon={Building2}
          message="Aucun club trouvé"
          description="Essayez un autre nom ou élargissez les filtres."
          action={activeFilters > 0 ? <Button variant="outline" size="sm" onClick={resetFilters}>Effacer les filtres</Button> : undefined}
        />
      ) : (
        <>
          <p className="mb-3 text-xs font-semibold text-muted">
            {total} club{total > 1 ? "s" : ""}
          </p>
          <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-1">
            {clubs.map((c) => (
              <li key={c.id}>
                <ClubCard club={c} href={`/athlete/clubs/${c.id}`} active={focusId === c.id} onHover={setFocusId} />
              </li>
            ))}
          </ul>
          <div ref={sentinel} className="flex justify-center py-6 text-primary">
            {isFetchingNextPage && <Spinner className="size-6" />}
          </div>
        </>
      )}
    </>
  );

  const missing = clubs.length - mapped.length;

  return (
    <>
      <PageHeader
        title="Clubs"
        subtitle="Trouvez un club affilié à la ligue"
        actions={
          <Segmented
            className="lg:hidden"
            ariaLabel="Mode d'affichage"
            value={view}
            onChange={setView}
            options={[
              { value: "list", label: "Liste", icon: <List /> },
              { value: "map", label: "Carte", icon: <MapIcon /> },
            ]}
          />
        }
      />

      <PageContainer className="mt-3 md:mt-0">
        {/* Recherche + filtres */}
        <div className="flex gap-2">
          <label className="flex h-12 flex-1 items-center gap-2 rounded-md border border-line bg-surface px-3.5 focus-within:border-primary">
            <Search className="size-[18px] shrink-0 text-muted" />
            <span className="sr-only">Rechercher un club</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un club…"
              className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-white placeholder:text-muted focus:outline-none"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Effacer la recherche" className="text-muted hover:text-white">
                <X className="size-[18px]" />
              </button>
            )}
          </label>
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            aria-expanded={showFilters}
            className={cn(
              "relative inline-flex h-12 items-center gap-2 rounded-md border px-3.5 text-sm font-semibold transition-colors",
              showFilters || activeFilters ? "border-primary text-primary" : "border-line bg-surface text-white hover:bg-surface-2",
            )}
          >
            <SlidersHorizontal className="size-[18px]" />
            <span className="hidden sm:inline">Filtres</span>
            {activeFilters > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-primary text-[11px] font-bold text-white">{activeFilters}</span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 grid grid-cols-1 gap-3 rounded-lg border border-line bg-surface p-4 animate-fade-in sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted">Ville</span>
              <input
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                placeholder="Ex : Abidjan"
                className="h-11 w-full rounded-md border border-line bg-ink px-3 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted">Prix mensuel max (FCFA)</span>
              <input
                value={prixMax}
                onChange={(e) => setPrixMax(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                placeholder="Ex : 20000"
                className="h-11 w-full rounded-md border border-line bg-ink px-3 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none"
              />
            </label>
            <Button variant="ghost" size="sm" onClick={resetFilters} disabled={!activeFilters} className="h-11">
              Réinitialiser
            </Button>
            <div className="sm:col-span-3">
              <span className="mb-1.5 block text-xs font-semibold text-muted">Discipline</span>
              <div className="flex flex-wrap gap-2">
                <Chip active={!discipline} onClick={() => setDiscipline("")}>Toutes</Chip>
                {(Object.keys(DISCIPLINE_LABELS) as Discipline[]).map((d) => (
                  <Chip key={d} active={discipline === d} onClick={() => setDiscipline(d)}>
                    {DISCIPLINE_LABELS[d]}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Contenu : liste / carte (mobile & tablette), vue partagée (desktop) */}
        <div className="mt-4 lg:grid lg:grid-cols-[minmax(340px,420px)_minmax(0,1fr)] lg:gap-6">
          <div className={cn(view === "map" && "hidden lg:block")}>{list}</div>
          <div
            className={cn(
              "relative -mx-4 h-[calc(100dvh-230px-var(--bottom-nav-h))] min-h-[360px] overflow-hidden sm:mx-0 sm:rounded-lg sm:border sm:border-line md:h-[calc(100dvh-240px)]",
              "lg:sticky lg:top-6 lg:block lg:h-[calc(100dvh-180px)]",
              view === "list" && "hidden",
            )}
          >
            {!isLoading && <ClubsMap clubs={mapped} hrefFor={(id) => `/athlete/clubs/${id}`} focusId={focusId} onSelect={setFocusId} className="h-full" />}
            {!isLoading && mapped.length === 0 && (
              <div className="pointer-events-none absolute inset-x-0 top-4 z-[500] flex justify-center">
                <p className="rounded-full border border-line bg-surface px-4 py-2 text-xs font-semibold text-muted">Aucun club géolocalisé</p>
              </div>
            )}
            {missing > 0 && (
              <div className="pointer-events-none absolute top-3 left-3 z-[500] flex items-center gap-1.5 rounded-full border border-line bg-surface/95 px-3 py-1.5 text-[11px] text-muted">
                <Info className="size-3.5" />
                {missing} club(s) sans localisation non affichés
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </>
  );
}
