"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Plus, PlusCircle, X } from "lucide-react";
import { toast } from "sonner";
import { useMyClub, useUpdateMyClub } from "@/lib/hooks/clubs";
import { capitalize } from "@/lib/utils";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { Card, ErrorState, SkeletonList } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/field";

const SUGGESTIONS = [
  "Tatamis", "Sacs de frappe", "Protège-tibias", "Casques", "Gants", "Plastrons", "Miroirs",
  "Vestiaires", "Douches", "Parking", "Climatisation", "Salle de musculation",
];

export default function EditEquipementsPage() {
  const { data: club, isLoading, isError, refetch } = useMyClub();
  if (isLoading) return <SkeletonList count={2} className="p-4 md:p-8" />;
  if (isError || !club) return <ErrorState onRetry={() => refetch()} className="pt-16" />;
  return <EquipementsForm initial={club.equipements ?? []} />;
}

function EquipementsForm({ initial }: { initial: string[] }) {
  const router = useRouter();
  const update = useUpdateMyClub("Équipements mis à jour");
  const [items, setItems] = useState<string[]>(initial);
  const [input, setInput] = useState("");

  const has = (v: string) => items.some((i) => i.toLowerCase() === v.toLowerCase());
  const add = (value: string) => {
    const v = value.trim();
    if (!v) return;
    if (has(v)) return void toast.info("Déjà dans la liste");
    setItems((p) => [...p, v]);
    setInput("");
  };
  const suggestions = SUGGESTIONS.filter((s) => !has(s));

  return (
    <>
      <PageHeader title="Équipements" backHref="/maitre/club" size="md" />
      <PageContainer size="md" className="mt-4 space-y-6 md:mt-0">
        <Card className="p-5">
          <FieldLabel>Ajouter un équipement</FieldLabel>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              add(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ex : Tatamis, sacs de frappe…"
              aria-label="Nouvel équipement"
              className="h-12 min-w-0 flex-1 rounded-md border-[1.5px] border-line bg-ink/40 px-3.5 text-[15px] text-white placeholder:text-muted focus:border-primary focus:outline-none"
            />
            <Button type="submit" size="icon" className="size-12 rounded-md" disabled={!input.trim()} aria-label="Ajouter">
              <Plus className="size-5" />
            </Button>
          </form>

          {suggestions.length > 0 && (
            <>
              <FieldLabel className="mt-5">Suggestions</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => add(s)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[13px] text-white hover:border-primary hover:text-primary"
                  >
                    <PlusCircle className="size-3.5 text-primary" />
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}
        </Card>

        <section>
          <FieldLabel>Équipements sélectionnés{items.length ? ` (${items.length})` : ""}</FieldLabel>
          {items.length === 0 ? (
            <div className="flex flex-col items-center rounded-lg bg-surface py-10 text-muted">
              <Box className="mb-2 size-8" strokeWidth={1.5} />
              <p className="text-sm">Aucun équipement ajouté</p>
            </div>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {items.map((eq) => (
                <li key={eq} className="inline-flex items-center gap-2 rounded-full bg-secondary py-1.5 pr-1.5 pl-3.5 text-[13px] font-semibold text-white">
                  {capitalize(eq)}
                  <button
                    type="button"
                    onClick={() => setItems((p) => p.filter((e) => e !== eq))}
                    className="grid size-6 place-items-center rounded-full hover:bg-black/20"
                    aria-label={`Retirer ${eq}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex gap-3">
          <Button variant="subtle" size="lg" onClick={() => router.push("/maitre/club")}>
            Annuler
          </Button>
          <Button
            size="lg"
            className="flex-1 sm:flex-none"
            loading={update.isPending}
            onClick={() => update.mutate({ equipements: items }, { onSuccess: () => router.push("/maitre/club") })}
          >
            Enregistrer
          </Button>
        </div>
      </PageContainer>
    </>
  );
}
