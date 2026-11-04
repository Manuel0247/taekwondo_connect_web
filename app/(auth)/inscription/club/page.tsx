"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Banknote, Building2, Check, CheckCircle2, Hash, Lock, Mail, MapPin, Phone, RotateCcw, Shield, User } from "lucide-react";
import type { z } from "zod";
import { registerClubSchema } from "@/lib/validation";
import { useRegisterClub } from "@/lib/hooks/auth";
import { DISCIPLINE_LABELS, PASSWORD_HINT } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { Discipline } from "@/lib/types";
import { FieldLabel, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/controls";
import { AuthScreen } from "@/components/auth/auth-ui";
import { LocationPicker } from "@/components/maps";

type Form = z.infer<typeof registerClubSchema>;
const STEPS = ["Informations personnelles", "Votre club", "Localisation"];
const STEP_FIELDS: Array<Array<keyof Form>> = [
  ["prenom", "nom", "email", "mot_de_passe", "mot_de_passe_confirmation"],
  ["club_nom", "adresse", "ville", "prix_mensuel", "prix_annuel"],
];

export default function RegisterClubPage() {
  const [step, setStep] = useState(0);
  const [disciplines, setDisciplines] = useState<Discipline[]>(["taekwondo_sport"]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState("");
  const mutation = useRegisterClub();

  const { register, handleSubmit, trigger, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(registerClubSchema),
    mode: "onTouched",
  });

  const next = async () => {
    if (await trigger(STEP_FIELDS[step])) setStep((s) => s + 1);
  };

  const onSubmit = (d: Form) => {
    if (!location) {
      setLocationError("Placez votre club sur la carte");
      return;
    }
    mutation.mutate({
      nom: d.nom,
      prenom: d.prenom,
      email: d.email,
      mot_de_passe: d.mot_de_passe,
      mot_de_passe_confirmation: d.mot_de_passe_confirmation,
      telephone: d.telephone || undefined,
      club_nom: d.club_nom,
      description: d.description || undefined,
      adresse: d.adresse,
      ville: d.ville,
      code_postal: d.code_postal || undefined,
      latitude: location.latitude,
      longitude: location.longitude,
      disciplines,
      prix_mensuel: d.prix_mensuel ? parseFloat(d.prix_mensuel) : undefined,
      prix_annuel: d.prix_annuel ? parseFloat(d.prix_annuel) : undefined,
    });
  };

  // Une erreur de validation API sur l'étape 1 ou 2 : on y revient
  const onInvalid = (errs: Partial<Record<keyof Form, unknown>>) => {
    const first = STEP_FIELDS.findIndex((fields) => fields.some((f) => errs[f]));
    if (first >= 0) setStep(first);
  };

  const toggle = (d: Discipline) =>
    setDisciplines((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  return (
    <AuthScreen
      width="lg"
      title="Créer un Club"
      subtitle="Inscrivez votre salle : elle sera visible après validation par la ligue."
      backHref="/connexion"
      footer={
        <p className="text-sm text-muted">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="font-bold text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      }
    >
      {/* Stepper 3 étapes */}
      <ol className="mb-2 flex items-center" aria-label="Étapes de l'inscription">
        {STEPS.map((label, i) => (
          <Fragment key={label}>
            <li className="flex items-center" aria-current={i === step ? "step" : undefined}>
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full text-sm font-bold text-white transition-colors",
                  i <= step ? "bg-primary" : "bg-line",
                )}
              >
                {i < step ? <Check className="size-4" /> : i + 1}
              </span>
              <span className="sr-only">{label}</span>
            </li>
            {i < STEPS.length - 1 && (
              <li aria-hidden="true" className={cn("mx-2 h-0.5 flex-1 rounded-full transition-colors", step > i ? "bg-primary" : "bg-line")} />
            )}
          </Fragment>
        ))}
      </ol>
      <p className="mb-6 text-sm font-semibold text-muted">
        Étape {step + 1} sur 3 · <span className="text-white">{STEPS[step]}</span>
      </p>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
        <div className={cn(step !== 0 && "hidden")}>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Input label="Prénom" autoComplete="given-name" placeholder="Franck" leftIcon={<User />} error={errors.prenom?.message} {...register("prenom")} />
            <Input label="Nom" autoComplete="family-name" placeholder="Yao" leftIcon={<User />} error={errors.nom?.message} {...register("nom")} />
          </div>
          <Input label="Email" type="email" autoComplete="email" placeholder="yao@email.com" leftIcon={<Mail />} error={errors.email?.message} {...register("email")} />
          <Input label="Téléphone (optionnel)" type="tel" autoComplete="tel" placeholder="+225 07 XX XX XX XX" leftIcon={<Phone />} {...register("telephone")} />
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Input label="Mot de passe" secure autoComplete="new-password" leftIcon={<Lock />} error={errors.mot_de_passe?.message} {...register("mot_de_passe")} />
            <Input label="Confirmer" secure autoComplete="new-password" leftIcon={<Lock />} error={errors.mot_de_passe_confirmation?.message} {...register("mot_de_passe_confirmation")} />
          </div>
          <p className="-mt-2 mb-5 text-xs text-muted">{PASSWORD_HINT}</p>
          <Button size="lg" fullWidth onClick={next}>
            Suivant →
          </Button>
        </div>

        <div className={cn(step !== 1 && "hidden")}>
          <Input label="Nom du club" placeholder="Club TKD Adjamé" leftIcon={<Shield />} error={errors.club_nom?.message} {...register("club_nom")} />
          <Textarea label="Description (optionnel)" placeholder="Décrivez votre club, votre équipe, vos valeurs…" {...register("description")} />
          <Input label="Adresse" autoComplete="street-address" placeholder="23 Rue de la Victoire" leftIcon={<MapPin />} error={errors.adresse?.message} {...register("adresse")} />
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Input label="Ville" autoComplete="address-level2" placeholder="Abidjan" leftIcon={<Building2 />} error={errors.ville?.message} {...register("ville")} />
            <Input label="Code postal (optionnel)" placeholder="07 BP 123" leftIcon={<Hash />} {...register("code_postal")} />
          </div>
          <FieldLabel>Disciplines</FieldLabel>
          <div className="mb-5 flex flex-wrap gap-2">
            {(Object.keys(DISCIPLINE_LABELS) as Discipline[]).map((d) => (
              <Chip key={d} active={disciplines.includes(d)} onClick={() => toggle(d)}>
                {DISCIPLINE_LABELS[d]}
              </Chip>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Input label="Prix mensuel (FCFA)" inputMode="numeric" placeholder="15000" leftIcon={<Banknote />} error={errors.prix_mensuel?.message} {...register("prix_mensuel")} />
            <Input label="Prix annuel (FCFA)" inputMode="numeric" placeholder="150000" leftIcon={<Banknote />} error={errors.prix_annuel?.message} {...register("prix_annuel")} />
          </div>
          <div className="mt-2 flex gap-3">
            <Button variant="subtle" size="lg" onClick={() => setStep(0)} icon={<ArrowLeft className="size-4" />} aria-label="Étape précédente" />
            <Button size="lg" fullWidth onClick={next}>
              Suivant →
            </Button>
          </div>
        </div>

        {step === 2 && (
          <div>
            <p className="mb-3 text-sm text-muted">
              Cliquez sur la carte (ou glissez l&apos;épingle) pour indiquer l&apos;emplacement exact de votre salle. Le bouton bleu utilise votre position.
            </p>
            <LocationPicker
              value={location}
              autoLocate
              onChange={(p) => {
                setLocation(p);
                setLocationError("");
              }}
              className="h-[320px] sm:h-[380px]"
            />
            <div className="mt-3 min-h-6 text-sm">
              {location ? (
                <div className="flex flex-wrap items-center gap-2">
                  <CheckCircle2 className="size-[18px] text-secondary-light" />
                  <span className="font-mono text-white">
                    {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                  </span>
                  <button type="button" onClick={() => setLocation(null)} className="ml-auto inline-flex items-center gap-1 text-muted hover:text-white">
                    <RotateCcw className="size-3.5" /> Repositionner
                  </button>
                </div>
              ) : (
                <p className="text-muted">Aucun emplacement sélectionné</p>
              )}
              {locationError && <p className="mt-1 text-[#f87171]" role="alert">{locationError}</p>}
            </div>
            <div className="mt-4 flex gap-3">
              <Button variant="subtle" size="lg" onClick={() => setStep(1)} icon={<ArrowLeft className="size-4" />} aria-label="Étape précédente" />
              <Button type="submit" size="lg" fullWidth loading={mutation.isPending}>
                Créer le club
              </Button>
            </div>
          </div>
        )}
      </form>
    </AuthScreen>
  );
}
