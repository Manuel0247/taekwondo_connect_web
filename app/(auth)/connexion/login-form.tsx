"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Clock, Lock, User } from "lucide-react";
import { loginSchema } from "@/lib/validation";
import { useLogin } from "@/lib/hooks/auth";
import { apiErrorCode, extractApiError } from "@/lib/api-error";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { AdminRedirectDialog, AuthScreen, SocialAuthButtons } from "@/components/auth/auth-ui";
import type { z } from "zod";

type Form = z.infer<typeof loginSchema>;

export function LoginForm() {
  const params = useSearchParams();
  const [adminOpen, setAdminOpen] = useState(false);
  const login = useLogin(() => setAdminOpen(true), params.get("redirect"));
  const expired = params.get("session") === "expiree";
  const oauthError = params.get("error");

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(loginSchema) });

  // Erreur 401 affichée en ligne (identifiants invalides), le reste en clair
  const inlineError =
    login.isError && apiErrorCode(login.error) !== "EMAIL_NOT_VERIFIED" ? extractApiError(login.error) : null;

  return (
    <AuthScreen
      showLogo
      title="Connexion"
      subtitle="Accédez à votre espace athlète ou maître de salle."
      footer={
        <div className="text-sm text-muted">
          Pas encore de compte ?
          <div className="mt-2 flex items-center justify-center gap-2 font-bold">
            <Link href="/inscription/athlete" className="text-primary hover:underline">
              Athlète
            </Link>
            <span className="text-muted">·</span>
            <Link href="/inscription/club" className="text-secondary-light hover:underline">
              Club
            </Link>
          </div>
        </div>
      }
    >
      {expired && (
        <div className="mb-5 flex gap-2.5 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning" role="status">
          <Clock className="mt-0.5 size-4 shrink-0" />
          Session expirée. Reconnectez-vous pour continuer.
        </div>
      )}
      {oauthError && (
        <div className="mb-5 flex gap-2.5 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-[#f87171]" role="alert">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {oauthError}
        </div>
      )}

      <form onSubmit={handleSubmit((d) => login.mutate(d))} noValidate>
        <Input
          label="Email ou identifiant"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="exemple@email.com ou jean.konan"
          leftIcon={<User />}
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Mot de passe"
          secure
          autoComplete="current-password"
          placeholder="••••••••"
          leftIcon={<Lock />}
          error={errors.mot_de_passe?.message}
          containerClassName="mb-2"
          {...register("mot_de_passe")}
        />
        <div className="mb-5 flex justify-end">
          <Link href="/mot-de-passe-oublie" className="text-[13px] font-semibold text-primary hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>

        {inlineError && (
          <p className="mb-4 flex gap-2 rounded-md bg-danger/10 p-3 text-sm text-[#f87171]" role="alert">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {inlineError}
          </p>
        )}

        <Button type="submit" size="lg" fullWidth loading={login.isPending}>
          Se connecter
        </Button>
      </form>

      <SocialAuthButtons />
      <AdminRedirectDialog open={adminOpen} onClose={() => setAdminOpen(false)} />
    </AuthScreen>
  );
}
