"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, Calendar, Clock, Users } from "lucide-react";
import { z } from "zod";
import { useCreateCourse } from "@/lib/hooks/courses";
import { COURSE_LEVELS, JOURS, JOURS_NUM, JOURS_SHORT } from "@/lib/config";
import { todayInput } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CourseLevel } from "@/lib/types";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { Card } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { Chip, Switch } from "@/components/ui/controls";
import { FieldLabel, Input, Textarea } from "@/components/ui/field";

const schema = z
  .object({
    titre: z.string().trim().min(3, "Titre requis (min 3 caractères)").max(150),
    description: z.string().optional(),
    date: z.string().min(1, "Date requise"),
    heure_debut: z.string().regex(/^\d{2}:\d{2}$/, "Heure requise"),
    heure_fin: z.string().regex(/^\d{2}:\d{2}$/, "Heure requise"),
    places_total: z.coerce.number({ message: "Requis" }).int("Nombre entier").min(1, "Entre 1 et 200 places").max(200, "Entre 1 et 200 places"),
  })
  .refine((d) => d.heure_fin > d.heure_debut, { message: "L'heure de fin doit suivre l'heure de début", path: ["heure_fin"] });

type FormIn = z.input<typeof schema>;
type FormOut = z.output<typeof schema>;
const NIVEAUX: CourseLevel[] = ["debutant", "intermediaire", "avance", "tous"];

export default function CreateCoursePage() {
  const router = useRouter();
  const create = useCreateCourse();
  const [niveau, setNiveau] = useState<CourseLevel>("tous");
  const [recurrent, setRecurrent] = useState(false);
  const [jours, setJours] = useState<string[]>([]);
  const [joursError, setJoursError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(schema),
    defaultValues: { titre: "", description: "", date: todayInput(), heure_debut: "09:00", heure_fin: "11:00", places_total: 20 },
  });

  const onSubmit = (d: FormOut) => {
    if (recurrent && jours.length === 0) {
      setJoursError("Sélectionnez au moins un jour");
      return;
    }
    create.mutate(
      {
        titre: d.titre,
        description: d.description || undefined,
        niveau,
        places_total: d.places_total,
        date_debut: `${d.date} ${d.heure_debut}:00`,
        date_fin: `${d.date} ${d.heure_fin}:00`,
        est_recurrent: recurrent,
        recurrence: recurrent ? "hebdomadaire" : undefined,
        // Entiers ISO attendus par l'API (lundi = 1 … dimanche = 7)
        jours_recurrence: recurrent ? jours.map((j) => JOURS_NUM[j]).sort() : undefined,
      },
      { onSuccess: () => router.push("/maitre/cours") },
    );
  };

  return (
    <>
      <PageHeader title="Créer un cours" backHref="/maitre/cours" size="lg" />
      <PageContainer size="lg" className="mt-4 md:mt-0">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-5 sm:p-6">
            <Input label="Titre du cours" placeholder="Entraînement débutants" leftIcon={<BookOpen />} error={errors.titre?.message} {...register("titre")} />
            <Textarea label="Description (optionnel)" rows={3} placeholder="Détails du cours…" {...register("description")} />
            <FieldLabel>Niveau</FieldLabel>
            <div className="mb-5 flex flex-wrap gap-2">
              {NIVEAUX.map((n) => (
                <Chip key={n} color="secondary" active={niveau === n} onClick={() => setNiveau(n)}>
                  {n === "tous" ? "Tous" : COURSE_LEVELS[n].label}
                </Chip>
              ))}
            </div>
            <Input
              label="Places totales"
              type="number"
              min={1}
              max={200}
              inputMode="numeric"
              leftIcon={<Users />}
              error={errors.places_total?.message}
              containerClassName="mb-0"
              {...register("places_total")}
            />
          </Card>

          <div className="space-y-6">
            <Card className="p-5 sm:p-6">
              <h2 className="mb-4 text-[17px] font-bold text-white">Date et horaires</h2>
              <Input label="Date" type="date" min={todayInput()} leftIcon={<Calendar />} error={errors.date?.message} {...register("date")} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Heure début" type="time" leftIcon={<Clock />} error={errors.heure_debut?.message} containerClassName="mb-0" {...register("heure_debut")} />
                <Input label="Heure fin" type="time" leftIcon={<Clock />} error={errors.heure_fin?.message} containerClassName="mb-0" {...register("heure_fin")} />
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <label className="flex items-center justify-between gap-4">
                <span>
                  <span className="block text-[15px] font-bold text-white">Cours récurrent</span>
                  <span className="text-xs text-muted">Répété chaque semaine les jours choisis</span>
                </span>
                <Switch label="Cours récurrent" color="secondary" checked={recurrent} onChange={setRecurrent} />
              </label>
              {recurrent && (
                <div className="mt-4 animate-fade-in">
                  <FieldLabel>Jours de la semaine</FieldLabel>
                  <div className="grid grid-cols-7 gap-1.5">
                    {JOURS.map((j) => {
                      const on = jours.includes(j);
                      return (
                        <button
                          key={j}
                          type="button"
                          aria-pressed={on}
                          onClick={() => {
                            setJoursError("");
                            setJours((p) => (on ? p.filter((x) => x !== j) : [...p, j]));
                          }}
                          className={cn(
                            "h-11 rounded-md border text-xs font-bold uppercase transition-colors",
                            on ? "border-secondary bg-secondary text-white" : "border-line bg-ink/40 text-muted hover:text-white",
                          )}
                        >
                          {JOURS_SHORT[j]}
                        </button>
                      );
                    })}
                  </div>
                  {joursError && <p className="mt-2 text-xs text-[#f87171]">{joursError}</p>}
                </div>
              )}
            </Card>

            <Button type="submit" variant="secondary" size="lg" fullWidth loading={create.isPending}>
              Créer le cours
            </Button>
          </div>
        </form>
      </PageContainer>
    </>
  );
}
