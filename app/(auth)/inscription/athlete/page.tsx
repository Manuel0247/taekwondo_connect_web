"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, User } from "lucide-react";
import type { z } from "zod";
import { registerAthleteSchema } from "@/lib/validation";
import { useRegisterAthlete } from "@/lib/hooks/auth";
import { PASSWORD_HINT } from "@/lib/config";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { AuthScreen, SocialAuthButtons } from "@/components/auth/auth-ui";

type Form = z.infer<typeof registerAthleteSchema>;

export default function RegisterAthletePage() {
  const mutation = useRegisterAthlete();
  // Validation en temps réel (mode onChange après la première soumission)
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(registerAthleteSchema),
    mode: "onTouched",
  });

  return (
    <AuthScreen
      title="Créer un compte Athlète"
      subtitle="Rejoignez la ligue, trouvez un club et réservez vos cours."
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
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Input label="Prénom" autoComplete="given-name" placeholder="Jean" leftIcon={<User />} error={errors.prenom?.message} {...register("prenom")} />
          <Input label="Nom" autoComplete="family-name" placeholder="Konan" leftIcon={<User />} error={errors.nom?.message} {...register("nom")} />
        </div>
        <Input label="Email" type="email" autoComplete="email" placeholder="jean@email.com" leftIcon={<Mail />} error={errors.email?.message} {...register("email")} />
        <Input
          label="Mot de passe"
          secure
          autoComplete="new-password"
          leftIcon={<Lock />}
          hint={PASSWORD_HINT}
          error={errors.mot_de_passe?.message}
          {...register("mot_de_passe")}
        />
        <Input
          label="Confirmer le mot de passe"
          secure
          autoComplete="new-password"
          leftIcon={<Lock />}
          error={errors.mot_de_passe_confirmation?.message}
          {...register("mot_de_passe_confirmation")}
        />
        <Button type="submit" size="lg" fullWidth loading={mutation.isPending} className="mt-2">
          S&apos;inscrire
        </Button>
      </form>
      <SocialAuthButtons />
    </AuthScreen>
  );
}
