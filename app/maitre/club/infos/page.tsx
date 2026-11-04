"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Banknote, Building2, Hash, MapPin, Shield } from "lucide-react";
import { z } from "zod";
import { useMyClub, useUpdateMyClub } from "@/lib/hooks/clubs";
import { priceRule } from "@/lib/validation";
import { DISCIPLINE_LABELS } from "@/lib/config";
import { toNumber } from "@/lib/utils";
import type { Club, Discipline } from "@/lib/types";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { Card, ErrorState, SkeletonList } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/controls";
import { FieldLabel, Input, Textarea } from "@/components/ui/field";
import { LocationPicker } from "@/components/maps";

const schema = z.object({
  nom: z.string().trim().min(3, "Nom du club requis (3 caractères min.)"),
  adresse: z.string().trim().min(5, "Adresse requise"),
  ville: z.string().trim().min(2, "Ville requise"),
  code_postal: z.string().optional(),
  description: z.string().optional(),
  prix_mensuel: priceRule,
  prix_annuel: priceRule,
});
type Form = z.infer<typeof schema>;

export default function EditClubInfoPage() {
  const { data: club, isLoading, isError, refetch } = useMyClub();
  if (isLoading) return <SkeletonList count={3} className="p-4 md:p-8" />;
  if (isError || !club) return <ErrorState onRetry={() => refetch()} className="pt-16" />;
  return <ClubInfoForm club={club} />;
}

function ClubInfoForm({ club }: { club: Club }) {
  const router = useRouter();
  const update = useUpdateMyClub();
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(() => {
    const lat = toNumber(club.latitude);
    const lng = toNumber(club.longitude);
    return lat !== null && lng !== null ? { latitude: lat, longitude: lng } : null;
  });
  const [disciplines, setDisciplines] = useState<string[]>(club.disciplines ?? []);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: club.nom,
      adresse: club.adresse,
      ville: club.ville,
      code_postal: club.code_postal ?? "",
      description: club.description ?? "",
      prix_mensuel: club.prix_mensuel != null ? String(club.prix_mensuel) : "",
      prix_annuel: club.prix_annuel != null ? String(club.prix_annuel) : "",
    },
  });

  const onSubmit = (d: Form) =>
    update.mutate(
      {
        nom: d.nom,
        adresse: d.adresse,
        ville: d.ville,
        code_postal: d.code_postal || undefined,
        description: d.description ?? "",
        prix_mensuel: d.prix_mensuel ? parseFloat(d.prix_mensuel) : undefined,
        prix_annuel: d.prix_annuel ? parseFloat(d.prix_annuel) : undefined,
        disciplines,
        ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
      },
      { onSuccess: () => router.push("/maitre/club") },
    );

  const toggle = (d: string) => setDisciplines((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]));

  return (
    <>
      <PageHeader title="Modifier les infos" subtitle={club.nom} backHref="/maitre/club" size="lg" />
      <PageContainer size="lg" className="mt-4 md:mt-0">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-5 sm:p-6">
            <Input label="Nom du club" leftIcon={<Shield />} error={errors.nom?.message} {...register("nom")} />
            <Input label="Adresse" leftIcon={<MapPin />} error={errors.adresse?.message} {...register("adresse")} />
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <Input label="Ville" leftIcon={<Building2 />} error={errors.ville?.message} {...register("ville")} />
              <Input label="Code postal" leftIcon={<Hash />} {...register("code_postal")} />
            </div>
            <Textarea label="Description" rows={5} {...register("description")} />
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <Input label="Prix mensuel (FCFA)" inputMode="numeric" leftIcon={<Banknote />} error={errors.prix_mensuel?.message} {...register("prix_mensuel")} />
              <Input label="Prix annuel (FCFA)" inputMode="numeric" leftIcon={<Banknote />} error={errors.prix_annuel?.message} {...register("prix_annuel")} />
            </div>
            <FieldLabel>Disciplines</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(DISCIPLINE_LABELS) as Discipline[]).map((d) => (
                <Chip key={d} active={disciplines.includes(d)} onClick={() => toggle(d)}>
                  {DISCIPLINE_LABELS[d]}
                </Chip>
              ))}
            </div>
          </Card>

          <div className="flex flex-col gap-4">
            <Card className="flex flex-1 flex-col p-5 sm:p-6">
              <h2 className="text-[17px] font-bold text-white">Localisation sur la carte</h2>
              <p className="mt-1 mb-4 text-sm text-muted">
                Permet aux athlètes de trouver votre salle. Cliquez sur la carte, glissez l&apos;épingle ou utilisez votre position.
              </p>
              <LocationPicker value={coords} onChange={setCoords} className="h-72 flex-1 lg:min-h-[340px]" />
              {coords && (
                <p className="mt-2 font-mono text-xs text-muted">
                  {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                </p>
              )}
            </Card>
            <div className="flex gap-3">
              <Button variant="subtle" size="lg" onClick={() => router.push("/maitre/club")} className="flex-1 sm:flex-none">
                Annuler
              </Button>
              <Button type="submit" size="lg" loading={update.isPending} className="flex-1">
                Enregistrer
              </Button>
            </div>
          </div>
        </form>
      </PageContainer>
    </>
  );
}
