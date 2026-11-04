"use client";

import { useEffect, useState } from "react";
import { CloudDownload, CloudOff, CloudCheck, Heart, PersonStanding, Search, X } from "lucide-react";
import { useOfflineSync, useTechniquesWithFavoris, useToggleFavorite } from "@/lib/hooks/techniques";
import { COURSE_LEVELS, DISCIPLINE_LABELS } from "@/lib/config";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { IconAction, PageContainer, PageHeader } from "@/components/layout/page";
import { EmptyState, ErrorState, ProgressBar, Skeleton } from "@/components/ui/display";
import { Chip, ChipRow } from "@/components/ui/controls";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TechniqueCard } from "@/components/domain/cards";

const DISCIPLINES = ["taekwondo_sport", "taekwondo_traditionnel", "poomsae", "self_defense"] as const;
const NIVEAUX = ["debutant", "intermediaire", "avance"] as const;

export default function TechniquesPage() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [discipline, setDiscipline] = useState<string | undefined>();
  const [niveau, setNiveau] = useState<string | undefined>();
  const [syncOpen, setSyncOpen] = useState(false);
  const toggleFav = useToggleFavorite();
  const offline = useOfflineSync();

  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { techniques, isLoading, isError, refetch, isOfflineMode } = useTechniquesWithFavoris({ q: q || undefined, discipline, niveau });

  const startSync = () => {
    setSyncOpen(true);
    offline.sync();
  };

  return (
    <>
      <PageHeader
        title="Techniques"
        subtitle="Bibliothèque de la ligue"
        actions={
          <>
            <IconAction
              label={offline.isAvailable ? "Copie hors-ligne" : "Rendre disponible hors-ligne"}
              onClick={() => (offline.isAvailable ? setSyncOpen(true) : startSync())}
              className={offline.isAvailable ? "text-secondary-light" : "text-muted"}
            >
              {offline.isAvailable ? <CloudCheck /> : <CloudDownload />}
            </IconAction>
            <IconAction href="/athlete/techniques/favoris" label="Mes favoris" className="text-danger">
              <Heart />
            </IconAction>
          </>
        }
      />

      <PageContainer className="mt-3 md:mt-0">
        {isOfflineMode && (
          <div className="mb-3 flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-[13px] text-warning" role="status">
            <CloudOff className="size-4" />
            Mode hors-ligne — données du {offline.lastSync ? offline.lastSync.toLocaleDateString("fr-FR") : "cache"}
          </div>
        )}
        {offline.isAvailable && !isOfflineMode && (
          <p className="mb-3 flex items-center gap-1.5 text-xs text-secondary-light">
            <CloudCheck className="size-3.5" />
            Disponible hors-ligne · sync {offline.lastSync ? formatRelative(offline.lastSync.toISOString()) : ""}
          </p>
        )}

        <label className="mb-3 flex h-12 items-center gap-2 rounded-md border border-line bg-surface px-3.5 focus-within:border-primary md:max-w-md">
          <Search className="size-[18px] shrink-0 text-muted" />
          <span className="sr-only">Rechercher une technique</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une technique…"
            className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-white placeholder:text-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Effacer" className="text-muted hover:text-white">
              <X className="size-[18px]" />
            </button>
          )}
        </label>

        <ChipRow className="mb-2">
          <Chip active={!discipline} onClick={() => setDiscipline(undefined)}>Toutes disciplines</Chip>
          {DISCIPLINES.map((d) => (
            <Chip key={d} active={discipline === d} onClick={() => setDiscipline(d)}>
              {DISCIPLINE_LABELS[d]}
            </Chip>
          ))}
        </ChipRow>
        <ChipRow className="mb-5">
          <Chip color="secondary" active={!niveau} onClick={() => setNiveau(undefined)}>Tous niveaux</Chip>
          {NIVEAUX.map((n) => (
            <Chip key={n} color="secondary" active={niveau === n} onClick={() => setNiveau(n)}>
              {COURSE_LEVELS[n].label}
            </Chip>
          ))}
        </ChipRow>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-lg" />)}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : techniques.length === 0 ? (
          <EmptyState icon={PersonStanding} message="Aucune technique trouvée" description="Modifiez la recherche ou les filtres." />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {techniques.map((t) => (
              <li key={t.id}>
                <TechniqueCard
                  technique={t}
                  href={`/athlete/techniques/${t.id}`}
                  favouriteBusy={toggleFav.isPending && toggleFav.variables?.id === t.id}
                  onFavourite={() => toggleFav.mutate({ id: t.id, isFavori: !!t.est_favori })}
                />
              </li>
            ))}
          </ul>
        )}
      </PageContainer>

      {/* Synchronisation hors-ligne */}
      <Dialog
        open={syncOpen}
        onClose={() => !offline.isSyncing && setSyncOpen(false)}
        dismissible={!offline.isSyncing}
        title="Disponible hors-ligne"
        size="sm"
        footer={
          offline.isSyncing ? undefined : (
            <>
              {offline.isAvailable && (
                <Button variant="subtle" fullWidth onClick={() => { offline.clear(); setSyncOpen(false); }}>
                  Supprimer la copie
                </Button>
              )}
              <Button variant="secondary" fullWidth onClick={offline.sync}>
                {offline.isAvailable ? "Mettre à jour" : "Synchroniser"}
              </Button>
            </>
          )
        }
      >
        <div className="flex flex-col items-center text-center">
          <span className={cn("mb-3 grid size-14 place-items-center rounded-full", offline.status === "error" ? "bg-danger/15 text-[#f87171]" : "bg-secondary/15 text-secondary-light")}>
            {offline.isSyncing ? <Spinner className="size-7" /> : <CloudDownload className="size-7" />}
          </span>
          <p className="font-bold text-white">
            {offline.status === "fetching"
              ? "Récupération des techniques…"
              : offline.status === "downloading"
                ? "Préchargement des illustrations…"
                : offline.status === "done"
                  ? "Synchronisation terminée !"
                  : offline.status === "error"
                    ? "Erreur de synchronisation"
                    : offline.isAvailable
                      ? `Dernière synchronisation ${offline.lastSync ? formatRelative(offline.lastSync.toISOString()).toLowerCase() : ""}`
                      : "Consulter les techniques sans connexion"}
          </p>
          {offline.status === "downloading" && (
            <div className="mt-4 w-full">
              <ProgressBar value={offline.progress} color="#2EA55A" />
              <p className="mt-2 text-xs text-muted">
                {offline.current} / {offline.total} images
              </p>
            </div>
          )}
          {!offline.isSyncing && (
            <p className="mt-2 text-sm text-muted">
              Le catalogue est enregistré dans ce navigateur : il reste consultable si le serveur est injoignable.
            </p>
          )}
        </div>
      </Dialog>
    </>
  );
}
