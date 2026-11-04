"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Lock } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { resetPasswordSchema } from "@/lib/validation";
import { useForgotPassword, useResetPassword } from "@/lib/hooks/auth";
import { PASSWORD_HINT } from "@/lib/config";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { AuthScreen } from "@/components/auth/auth-ui";

type Form = z.infer<typeof resetPasswordSchema>;

export function ResetForm() {
  const email = useSearchParams().get("email") ?? "";
  const reset = useResetPassword();
  const resend = useForgotPassword();
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(resetPasswordSchema) });

  if (!email) {
    return (
      <AuthScreen title="Lien incomplet" subtitle="Recommencez la procédure depuis « Mot de passe oublié »." backHref="/connexion">
        <Link href="/mot-de-passe-oublie" className="font-bold text-primary hover:underline">
          Recevoir un nouveau code
        </Link>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Nouveau mot de passe"
      subtitle={
        <>
          Saisissez le code reçu à <span className="font-semibold text-white">{email}</span> puis votre nouveau mot de passe.
        </>
      }
      backHref="/mot-de-passe-oublie"
    >
      <form onSubmit={handleSubmit((d) => reset.mutate({ email, ...d }))} noValidate>
        <Input
          label="Code reçu par email"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          leftIcon={<KeyRound />}
          error={errors.code?.message}
          {...register("code")}
        />
        <Input label="Nouveau mot de passe" secure autoComplete="new-password" leftIcon={<Lock />} hint={PASSWORD_HINT} error={errors.mot_de_passe?.message} {...register("mot_de_passe")} />
        <Input label="Confirmer" secure autoComplete="new-password" leftIcon={<Lock />} error={errors.mot_de_passe_confirmation?.message} {...register("mot_de_passe_confirmation")} />
        <Button type="submit" size="lg" fullWidth loading={reset.isPending} className="mt-2">
          Réinitialiser
        </Button>
      </form>
      <button
        type="button"
        disabled={resend.isPending}
        onClick={() =>
          resend.mutate(email, {
            onSuccess: () => toast.success("Nouveau code envoyé", { description: "Vérifiez votre boîte mail" }),
          })
        }
        className="mt-5 w-full text-center text-sm font-semibold text-primary hover:underline disabled:opacity-60"
      >
        {resend.isPending ? "Envoi…" : "Je n'ai pas reçu de code"}
      </button>
    </AuthScreen>
  );
}
