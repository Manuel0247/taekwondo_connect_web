"use client";

import { useState } from "react";
import { Check, ChevronDown, Circle, Shield } from "lucide-react";
import { useMyClub, useMyClubs, useSwitchClub } from "@/lib/hooks/clubs";
import { CLUB_STATUS } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

/**
 * Sélecteur du club actif pour un maître de salle qui gère plusieurs clubs.
 * N'affiche rien s'il n'a qu'un seul club.
 */
export function ClubSwitcher({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const { data: clubs } = useMyClubs();
  const { data: current } = useMyClub();
  const switchClub = useSwitchClub();

  if (!clubs || clubs.length < 2) return null;

  // Club réellement servi par l'API (le club enregistré peut ne plus être valable)
  const active = clubs.find((c) => c.id === current?.id) ?? clubs[0];

  const choose = async (id: string) => {
    if (id !== active.id) {
      setSwitching(id);
      try {
        await switchClub(id);
      } finally {
        setSwitching(null);
      }
    }
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md border border-line bg-surface px-3 py-2.5 text-left transition-colors hover:border-secondary sm:w-auto sm:min-w-72",
          className,
        )}
        aria-label={`Club actif : ${active.nom}. Changer de club`}
      >
        <Shield className="size-4 shrink-0 text-secondary-light" />
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">{active.nom}</span>
        <span className="text-xs text-muted">{clubs.length} clubs</span>
        <ChevronDown className="size-4 text-muted" />
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Choisir un club"
        description="Les athlètes, cours et invitations affichés seront ceux de ce club."
        size="sm"
      >
        <ul className="space-y-2" role="radiogroup" aria-label="Mes clubs">
          {clubs.map((c) => {
            const selected = c.id === active.id;
            const statut = CLUB_STATUS[c.statut] ?? CLUB_STATUS.en_attente;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={!!switching}
                  onClick={() => choose(c.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md border px-3 py-3 text-left transition-colors",
                    selected ? "border-secondary bg-secondary/12" : "border-line hover:bg-white/5",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold text-white">{c.nom}</span>
                    <span className="text-xs text-muted">
                      {c.ville} · <span style={{ color: statut.color }}>{statut.label}</span>
                    </span>
                  </span>
                  {switching === c.id ? (
                    <Spinner />
                  ) : selected ? (
                    <Check className="size-5 text-secondary-light" />
                  ) : (
                    <Circle className="size-5 text-line" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </Dialog>
    </>
  );
}
