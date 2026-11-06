"use client";

import { useMemo, useState } from "react";
import { Check, CheckCircle2, Lock, Search, XCircle } from "lucide-react";
import { useClubAthletes } from "@/lib/hooks/athletes";
import { useEventDetail, useEventInscriptions, useProposeAthletes, useRemoveInscription } from "@/lib/hooks/events";
import { cn } from "@/lib/utils";
import type { Inscription } from "@/lib/types";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { Avatar, ErrorState, GradeChip, SectionTitle, SkeletonList } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { athleteName, InscriptionBadge } from "@/components/domain/cards";
import { EventSummary } from "@/components/domain/event-summary";

export function ProposeAthletes({ id }: { id: string }) {
  const { data: event, isLoading, isError, refetch } = useEventDetail(id);
  const insc = useEventInscriptions(id);
  const club = useClubAthletes();
  const propose = useProposeAthletes();
  const remove = useRemoveInscription();
  const confirm = useConfirm();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");

  const clubAthletes = useMemo(() => club.data ?? [], [club.data]);
  const clubIds = useMemo(() => new Set(clubAthletes.map((a) => a.id)), [clubAthletes]);
  // Seules les inscriptions des athlètes du club du maître
  const mine = (insc.data ?? []).filter((i) => i.athlete?.id && clubIds.has(i.athlete.id));
  const inscribed = new Set(mine.map((i) => i.athlete!.id));
  const eligible = clubAthletes
    .filter((a) => !inscribed.has(a.id))
    .filter((a) => !filter || athleteName(a).toLowerCase().includes(filter.toLowerCase()));

  if (isLoading) return <SkeletonList count={3} className="p-4 md:p-8" />;
  if (isError || !event) return <ErrorState message="Événement introuvable" onRetry={() => refetch()} className="pt-16" />;

  const placesLeft = event.places_disponibles ?? -1; // -1 : valeur inconnue → ne bloque pas
  const isFull = placesLeft === 0;
  const isClosed = event.statut === "termine" || event.statut === "annule";
  const deadlinePassed = !!event.date_limite_inscription && new Date(event.date_limite_inscription) < new Date();
  const locked = isFull || isClosed || deadlinePassed;
  const lockedReason = isClosed ? `Événement ${event.statut === "termine" ? "terminé" : "annulé"}` : deadlinePassed ? "Date limite dépassée" : "Événement complet";
  const overCapacity = placesLeft > 0 && selected.size > placesLeft;

  const toggle = (aid: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(aid)) n.delete(aid);
      else n.add(aid);
      return n;
    });

  const onRemove = async (i: Inscription) => {
    if (await confirm({ title: "Retirer l'inscription", message: `Retirer ${athleteName(i.athlete)} de cet événement ?`, confirmLabel: "Retirer", danger: true })) {
      remove.mutate({ eventId: id, inscriptionId: i.id });
    }
  };

  const allVisibleSelected = eligible.length > 0 && eligible.every((a) => selected.has(a.id));

  return (
    <>
      <PageHeader title="Proposer des athlètes" subtitle={event.titre} backHref="/maitre/evenements" />
      <PageContainer className={cn("mt-4 grid gap-8 md:mt-0 xl:grid-cols-[minmax(0,1fr)_440px]", !locked && eligible.length > 0 && "pb-28 md:pb-0")}>
        <div className="min-w-0">
          <EventSummary event={event} />
        </div>

        <div className="space-y-6">
          {!insc.isLoading && mine.length > 0 && (
            <section>
              <SectionTitle>Déjà proposés ({mine.length})</SectionTitle>
              <ul className="space-y-2">
                {mine.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 rounded-md bg-surface p-3">
                    <Avatar src={i.athlete?.user?.photo_url} name={athleteName(i.athlete)} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{athleteName(i.athlete)}</p>
                      <GradeChip grade={i.athlete?.grade} dan={i.athlete?.dan} className="mt-1" />
                    </div>
                    <InscriptionBadge statut={i.statut} />
                    {(i.statut === "en_attente" || i.statut === "propose") && !isClosed && (
                      <button
                        type="button"
                        onClick={() => onRemove(i)}
                        disabled={remove.isPending}
                        className="grid size-9 place-items-center rounded-full text-[#f87171] hover:bg-danger/10"
                        aria-label={`Retirer ${athleteName(i.athlete)}`}
                      >
                        {remove.isPending && remove.variables?.inscriptionId === i.id ? <Spinner className="size-4" /> : <XCircle className="size-5" />}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <SectionTitle
              action={
                !locked && eligible.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setSelected(allVisibleSelected ? new Set() : new Set(eligible.map((a) => a.id)))}
                    className="text-[13px] font-semibold text-secondary-light hover:underline"
                  >
                    {allVisibleSelected ? "Tout désélectionner" : "Tout sélectionner"}
                  </button>
                ) : undefined
              }
            >
              {locked
                ? "Inscriptions fermées"
                : club.isLoading
                  ? "Athlètes du club"
                  : clubAthletes.length > inscribed.size
                    ? `Sélectionner des athlètes (${clubAthletes.length - inscribed.size})`
                    : "Tous vos athlètes sont déjà proposés"}
            </SectionTitle>

            {locked ? (
              <div className="flex flex-col items-center rounded-lg border border-danger/30 bg-danger/10 p-6 text-center">
                <Lock className="size-7 text-[#f87171]" />
                <p className="mt-2 font-bold text-[#f87171]">{lockedReason}</p>
                <p className="mt-1 text-sm text-muted">
                  {isFull && !isClosed && !deadlinePassed
                    ? "Toutes les places sont prises. Il n'est plus possible de proposer des athlètes."
                    : "Il n'est plus possible de proposer des athlètes pour cet événement."}
                </p>
              </div>
            ) : club.isLoading || insc.isLoading ? (
              <SkeletonList count={2} />
            ) : clubAthletes.length > 0 && clubAthletes.length === inscribed.size ? (
              <div className="flex flex-col items-center rounded-lg bg-surface p-6 text-center">
                <CheckCircle2 className="size-10 text-secondary-light" />
                <p className="mt-2 text-sm text-muted">Tous les athlètes de votre club ont été proposés pour cet événement.</p>
              </div>
            ) : (
              <>
                {clubAthletes.length > 6 && (
                  <label className="mb-3 flex h-11 items-center gap-2 rounded-md border border-line bg-surface px-3 focus-within:border-secondary">
                    <Search className="size-4 text-muted" />
                    <input
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      placeholder="Filtrer par nom…"
                      aria-label="Filtrer les athlètes"
                      className="h-full flex-1 bg-transparent text-sm text-white placeholder:text-muted focus:outline-none"
                    />
                  </label>
                )}
                {clubAthletes.length === 0 && <p className="rounded-lg bg-surface p-4 text-sm text-muted">Aucun athlète validé dans votre club.</p>}
                <ul className="space-y-2">
                  {eligible.map((a) => {
                    const on = selected.has(a.id);
                    return (
                      <li key={a.id}>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={on}
                          onClick={() => toggle(a.id)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors",
                            on ? "border-secondary bg-secondary/10" : "border-transparent bg-surface hover:bg-surface-2",
                          )}
                        >
                          <span className={cn("grid size-6 shrink-0 place-items-center rounded-sm border-2", on ? "border-secondary bg-secondary" : "border-line")}>
                            {on && <Check className="size-4 text-white" />}
                          </span>
                          <Avatar src={a.user?.photo_url ?? a.photo_url} name={athleteName(a)} size={40} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-white">{athleteName(a)}</span>
                            <span className="text-xs text-muted">{a.categorie_poids ?? "Catégorie non renseignée"}</span>
                          </span>
                          <GradeChip grade={a.grade} dan={a.dan} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>

          {/* Action : barre flottante sur smartphone, en ligne sur grand écran */}
          {!locked && eligible.length > 0 && (
            <div className="fixed inset-x-0 z-30 border-t border-line bg-ink/95 p-4 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0" style={{ bottom: "calc(var(--bottom-nav-h) + env(safe-area-inset-bottom))" }}>
              {overCapacity && <p className="mb-2 text-center text-xs text-warning">Seulement {placesLeft} place(s) restante(s).</p>}
              <Button
                size="lg"
                fullWidth
                variant={selected.size === 0 ? "outline-secondary" : "secondary"}
                disabled={selected.size === 0}
                loading={propose.isPending}
                onClick={() => propose.mutate({ eventId: id, athleteIds: Array.from(selected) }, { onSuccess: () => setSelected(new Set()) })}
              >
                {selected.size === 0 ? "Sélectionnez des athlètes" : `Proposer ${selected.size} athlète${selected.size > 1 ? "s" : ""}`}
              </Button>
            </div>
          )}
        </div>
      </PageContainer>
    </>
  );
}
