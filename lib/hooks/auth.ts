"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authApi, type AuthResponse, type RegisterAthletePayload, type RegisterClubPayload } from "../api/endpoints";
import { useAuthStore } from "../stores";
import { apiErrorCode, extractApiError } from "../api-error";
import { homeForRole } from "../session";

/**
 * Applique la session après connexion. L'espace web est réservé aux athlètes et
 * maîtres de salle : un administrateur voit son jeton révoqué (il n'est conservé
 * nulle part) et est invité à utiliser le webadmin — comme sur le mobile.
 */
export function useApplySession() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();
  return async (res: AuthResponse, onAdmin: () => void, redirect?: string | null) => {
    if (res.user.role === "admin") {
      await authApi.logout(res.token).catch(() => {});
      onAdmin();
      return;
    }
    setAuth(res.user, res.token);
    const home = homeForRole(res.user.role);
    // Retour à la page demandée avant la connexion, si elle appartient à l'espace du rôle
    const target = redirect && (redirect === home || redirect.startsWith(`${home}/`)) ? redirect : home;
    router.replace(target);
  };
}

export function useLogin(onAdmin: () => void, redirect?: string | null) {
  const apply = useApplySession();
  const router = useRouter();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (res) => apply(res, onAdmin, redirect),
    onError: (err) => {
      const details = (err as { response?: { data?: { error?: { details?: { email?: string } } } } })
        ?.response?.data?.error?.details;
      if (apiErrorCode(err) === "EMAIL_NOT_VERIFIED" && details?.email) {
        toast.info("Email non vérifié", { description: "Saisissez le code reçu par email" });
        router.push(`/verification?email=${encodeURIComponent(details.email)}`);
      }
    },
  });
}

export function useRegisterAthlete() {
  const router = useRouter();
  return useMutation({
    mutationFn: (p: RegisterAthletePayload) => authApi.registerAthlete(p),
    onSuccess: ({ email }) => router.replace(`/verification?email=${encodeURIComponent(email)}`),
    onError: (err) => toast.error("Inscription échouée", { description: extractApiError(err) }),
  });
}

export function useRegisterClub() {
  const router = useRouter();
  return useMutation({
    mutationFn: (p: RegisterClubPayload) => authApi.registerClub(p),
    onSuccess: ({ email }) => router.replace(`/verification?email=${encodeURIComponent(email)}`),
    onError: (err) => toast.error("Inscription échouée", { description: extractApiError(err) }),
  });
}

export function useVerifyOtp(onAdmin: () => void) {
  const apply = useApplySession();
  return useMutation({
    mutationFn: authApi.verifyOtp,
    onSuccess: async (res) => {
      toast.success("Email vérifié !", { description: "Bienvenue sur LCC Taekwondo" });
      await apply(res, onAdmin);
    },
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: authApi.resendOtp,
    onSuccess: () => toast.success("Code renvoyé", { description: "Vérifiez votre boîte mail" }),
    onError: (err) => toast.error("Erreur", { description: extractApiError(err) }),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: authApi.forgotPassword,
    onError: (err) => toast.error("Envoi impossible", { description: extractApiError(err) }),
  });
}

export function useResetPassword() {
  const router = useRouter();
  return useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: () => {
      toast.success("Mot de passe modifié", { description: "Connectez-vous avec votre nouveau mot de passe" });
      router.replace("/connexion");
    },
    onError: (err) => toast.error("Réinitialisation échouée", { description: extractApiError(err) }),
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const qc = useQueryClient();
  const router = useRouter();
  return async () => {
    await authApi.logout().catch(() => {});
    logout();
    qc.clear();
    router.replace("/connexion");
  };
}
