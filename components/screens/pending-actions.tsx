"use client";

import { Check, X } from "lucide-react";
import { useRejectAthlete, useValidateAthlete } from "@/lib/hooks/athletes";
import type { Athlete } from "@/lib/types";
import { Button } from "../ui/button";
import { useConfirm } from "../ui/dialog";
import { athleteName } from "../domain/cards";

/** Boutons Valider / Refuser d'une demande d'adhésion (dashboard + écran Athlètes) */
export function PendingActions({ athlete, compact }: { athlete: Athlete; compact?: boolean }) {
  const validate = useValidateAthlete();
  const reject = useRejectAthlete();
  const confirm = useConfirm();
  const busyV = validate.isPending && validate.variables === athlete.id;
  const busyR = reject.isPending && reject.variables?.id === athlete.id;

  const onReject = async () => {
    if (
      await confirm({
        title: "Refuser la demande",
        message: `Voulez-vous refuser la demande d'adhésion de ${athleteName(athlete)} ?`,
        confirmLabel: "Refuser",
        danger: true,
      })
    ) {
      reject.mutate({ id: athlete.id, motif: "Demande refusée par le maître de salle" });
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        size="sm"
        className={compact ? undefined : "flex-1"}
        loading={busyV}
        disabled={busyR}
        onClick={() => validate.mutate(athlete.id)}
        icon={<Check className="size-4" />}
      >
        Valider
      </Button>
      <Button
        variant="danger"
        size="sm"
        className={compact ? undefined : "flex-1"}
        loading={busyR}
        disabled={busyV}
        onClick={onReject}
        icon={<X className="size-4" />}
      >
        Refuser
      </Button>
    </div>
  );
}
