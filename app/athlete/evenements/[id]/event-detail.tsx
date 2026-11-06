"use client";

import { CheckCircle2, Clock, Wallet, XCircle } from "lucide-react";
import { useEventDetail, useMyEventInscriptions } from "@/lib/hooks/events";
import { useMyAthleteProfile } from "@/lib/hooks/athletes";
import { formatFcfa } from "@/lib/format";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { ErrorState, SkeletonList } from "@/components/ui/display";
import { EventSummary } from "@/components/domain/event-summary";

export function AthleteEventDetail({ id }: { id: string }) {
  const { data: event, isLoading, isError, refetch } = useEventDetail(id);
  const { data: mine } = useMyEventInscriptions();
  const { data: athlete } = useMyAthleteProfile();

  // Statut de ma propre inscription (détail, ou à défaut liste de mes inscriptions)
  const statut = event?.mon_inscription?.statut ?? mine?.find((i) => i.event.id === id)?.statut;
  const moi = mine?.find((i) => i.event.id === id);
  const resultat = moi?.resultat;
  const note = event?.mon_inscription?.note ?? moi?.note;
  const actif = statut && statut !== "refuse" && statut !== "annule";
  const montantDu = actif ? moi?.montant_du : null;

  const status =
    statut === "confirme"
      ? { cls: "bg-secondary/15 text-secondary-light", icon: <CheckCircle2 className="size-5" />, text: "Inscription confirmée" }
      : statut === "en_attente" || statut === "propose"
        ? { cls: "bg-primary/12 text-primary", icon: <Clock className="size-5" />, text: statut === "propose" ? "Vous avez été proposé" : "Inscription en attente" }
        : statut === "refuse" || statut === "annule"
          ? { cls: "bg-danger/12 text-[#f87171]", icon: <XCircle className="size-5" />, text: statut === "refuse" ? "Inscription rejetée" : "Inscription annulée" }
          : null;

  return (
    <>
      <PageHeader title="Événement" backHref="/athlete/evenements" size="lg" />
      <PageContainer size="lg" className="mt-4 md:mt-0">
        {isLoading ? (
          <SkeletonList count={3} />
        ) : isError || !event ? (
          <ErrorState message="Événement introuvable" onRetry={() => refetch()} />
        ) : (
          <EventSummary event={event} grade={athlete?.grade} dan={athlete?.dan}>
            {status && (
              <div className={`flex items-center gap-2.5 rounded-md p-4 text-sm font-bold ${status.cls}`}>
                {status.icon}
                <span>
                  {status.text}
                  {resultat && <span className="block text-xs font-medium text-white/80">Résultat : {resultat}</span>}
                  {note != null && <span className="block text-xs font-medium text-white/80">Note de l’examen : {note}</span>}
                </span>
              </div>
            )}
            {montantDu != null && (
              <div className={`flex items-center gap-2.5 rounded-md p-4 text-sm font-bold ${moi?.paye_le ? "bg-secondary/15 text-secondary-light" : "bg-primary/12 text-primary"}`}>
                <Wallet className="size-5" />
                <span>{moi?.paye_le ? `Participation payée · ${formatFcfa(montantDu)}` : `À payer : ${formatFcfa(montantDu)}`}</span>
              </div>
            )}
          </EventSummary>
        )}
      </PageContainer>
    </>
  );
}
