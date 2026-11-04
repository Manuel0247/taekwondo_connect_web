"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMyClub, useUpdateHoraires } from "@/lib/hooks/clubs";
import { JOURS } from "@/lib/config";
import { capitalize } from "@/lib/utils";
import type { Club } from "@/lib/types";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { Card, ErrorState, SkeletonList } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/controls";

/** Formulaire dynamique par jour de la semaine (EditHorairesScreen) */
export default function EditHorairesPage() {
  const { data: club, isLoading, isError, refetch } = useMyClub();
  return (
    <>
      <PageHeader title="Horaires" subtitle="Laissez vide pour marquer comme fermé. Ex : 17h-19h" backHref="/maitre/club" size="md" />
      <PageContainer size="md" className="mt-4 md:mt-0">
        {isLoading ? <SkeletonList count={2} /> : isError || !club ? <ErrorState onRetry={() => refetch()} /> : <HorairesForm club={club} />}
      </PageContainer>
    </>
  );
}

function HorairesForm({ club }: { club: Club }) {
  const router = useRouter();
  const save = useUpdateHoraires();
  const [horaires, setHoraires] = useState<Record<string, string>>(() =>
    Object.fromEntries(JOURS.map((j) => [j, club.horaires?.[j] ?? ""])),
  );

  const submit = () =>
    save.mutate(Object.fromEntries(Object.entries(horaires).filter(([, v]) => v.trim() !== "").map(([k, v]) => [k, v.trim()])), {
      onSuccess: () => router.push("/maitre/club"),
    });

  return (
    <>
      <Card className="divide-y divide-line p-0">
        {JOURS.map((j) => {
          const open = (horaires[j] ?? "").trim() !== "";
          return (
            <div key={j} className="flex items-center gap-3 px-4 py-3">
              <label htmlFor={`h-${j}`} className="w-20 shrink-0 text-[15px] font-semibold text-white sm:w-24">
                {capitalize(j)}
              </label>
              <input
                id={`h-${j}`}
                value={horaires[j] ?? ""}
                onChange={(e) => setHoraires((p) => ({ ...p, [j]: e.target.value }))}
                placeholder="Fermé"
                className="h-11 min-w-0 flex-1 rounded-md border-[1.5px] border-line bg-ink/40 px-3 text-[15px] text-white placeholder:text-muted focus:border-primary focus:outline-none"
              />
              <Switch
                label={`${capitalize(j)} ouvert`}
                checked={open}
                onChange={(v) => setHoraires((p) => ({ ...p, [j]: v ? club.horaires?.[j] || "17h-19h" : "" }))}
              />
            </div>
          );
        })}
      </Card>
      <div className="mt-6 flex gap-3">
        <Button variant="subtle" size="lg" onClick={() => router.push("/maitre/club")}>
          Annuler
        </Button>
        <Button size="lg" className="flex-1 sm:flex-none" loading={save.isPending} onClick={submit}>
          Enregistrer
        </Button>
      </div>
    </>
  );
}
