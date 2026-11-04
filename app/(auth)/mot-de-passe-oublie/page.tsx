"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockOpen, Mail } from "lucide-react";
import { z } from "zod";
import { emailRule } from "@/lib/validation";
import { useForgotPassword } from "@/lib/hooks/auth";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { AuthScreen } from "@/components/auth/auth-ui";

const schema = z.object({ email: emailRule });

export default function ForgotPasswordPage() {
  const router = useRouter();
  const forgot = useForgotPassword();
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  return (
    <AuthScreen
      title="Mot de passe oublié"
      subtitle="Entrez votre email : nous vous enverrons un code à 6 chiffres pour choisir un nouveau mot de passe."
      backHref="/connexion"
    >
      <div className="mb-6 flex justify-center">
        <span className="grid size-20 place-items-center rounded-full bg-primary/12 text-primary">
          <LockOpen className="size-10" strokeWidth={1.6} />
        </span>
      </div>
      <form
        noValidate
        onSubmit={handleSubmit(({ email }) =>
          forgot.mutate(email, { onSuccess: () => router.push(`/reinitialisation?email=${encodeURIComponent(email)}`) }),
        )}
      >
        <Input label="Email" type="email" autoComplete="email" placeholder="votre@email.com" leftIcon={<Mail />} error={errors.email?.message} {...register("email")} />
        <Button type="submit" size="lg" fullWidth loading={forgot.isPending} className="mt-2">
          Recevoir le code
        </Button>
      </form>
    </AuthScreen>
  );
}
