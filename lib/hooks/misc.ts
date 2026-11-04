"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invitationsApi, notificationsApi, usersApi } from "../api/endpoints";
import { extractApiError } from "../api-error";
import { useAuthStore, useNotifStore } from "../stores";
import type { NotificationPreferences } from "../types";

const onErr = (err: unknown) => toast.error(extractApiError(err));

// ── Notifications ───────────────────────────────────────────────────────────

/**
 * Compteur de la cloche, calculé par l'API (la liste est paginée).
 * Règle métier 5 : rafraîchi au retour sur l'onglet (refetchOnWindowFocus) et chaque minute.
 */
export function useUnreadNotificationsCount(enabled = true) {
  const setUnreadCount = useNotifStore((s) => s.setUnreadCount);
  const q = useQuery({
    queryKey: ["notifications", "unreadCount"],
    queryFn: notificationsApi.unreadCount,
    enabled,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  useEffect(() => {
    if (q.data) setUnreadCount(q.data.count);
  }, [q.data, setUnreadCount]);
  return q;
}

export const useNotifications = () =>
  useQuery({ queryKey: ["notifications", "list"], queryFn: notificationsApi.list, refetchInterval: 60000 });

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  const decrement = useNotifStore((s) => s.decrement);
  return useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      decrement();
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: onErr,
  });
}

export const NOTIF_PREFS: Array<{ key: keyof NotificationPreferences; label: string; hint: string }> = [
  { key: "notif_cours", label: "Notifications cours", hint: "Nouveaux cours et changements de planning" },
  { key: "notif_evenements", label: "Notifications événements", hint: "Compétitions, stages et passages de grade" },
  { key: "notif_inscriptions", label: "Confirmations d'inscription", hint: "Réponses à vos inscriptions" },
  { key: "notif_validations", label: "Validations", hint: "Adhésions et validations de club" },
  { key: "notif_badges", label: "Badges reçus", hint: "Nouveaux badges obtenus" },
  { key: "rappel_j1", label: "Rappel 1 jour avant", hint: "La veille d'un cours ou d'un événement" },
  { key: "rappel_h2", label: "Rappel 2 heures avant", hint: "Juste avant le début" },
];

export const useUserMe = () => useQuery({ queryKey: ["userMe"], queryFn: usersApi.me });

/** Relit /users/me et met à jour l'utilisateur en session (ex. après changement de photo) */
export function useRefreshSessionUser() {
  const qc = useQueryClient();
  return async () => {
    const me = await qc.fetchQuery({ queryKey: ["userMe"], queryFn: usersApi.me, staleTime: 0 });
    const { user, setUser } = useAuthStore.getState();
    if (user) setUser({ ...user, nom: me.nom, prenom: me.prenom, photo_url: me.photo_url, telephone: me.telephone });
  };
}

export function useSaveNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.updatePreferences,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userMe"] });
      toast.success("Préférences enregistrées");
    },
    onError: onErr,
  });
}

// ── Compte ──────────────────────────────────────────────────────────────────

export function useUpdateAccount() {
  const qc = useQueryClient();
  const { user, setUser } = useAuthStore();
  return useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: (u) => {
      if (user) setUser({ ...user, nom: u.nom, prenom: u.prenom, telephone: u.telephone });
      qc.invalidateQueries({ queryKey: ["userMe"] });
      qc.invalidateQueries({ queryKey: ["athleteMe"] });
      toast.success("Informations mises à jour");
    },
    onError: onErr,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: usersApi.changePassword,
    onSuccess: () => toast.success("Mot de passe modifié"),
    onError: onErr,
  });
}

// ── Invitations ─────────────────────────────────────────────────────────────

export const useInvitations = () => useQuery({ queryKey: ["invitations"], queryFn: invitationsApi.list });

export function useSendInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => invitationsApi.send([email]),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["invitations"] });
      // L'API répond 200 même si l'email est refusé (déjà membre, invitation en cours)
      const erreur = res.erreurs[0];
      if (erreur) toast.error("Invitation non envoyée", { description: erreur.raison });
      else toast.success("Invitation envoyée");
    },
    onError: onErr,
  });
}

export function useResendInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: invitationsApi.resend,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Invitation renvoyée");
    },
    onError: onErr,
  });
}

export function useDeleteInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: invitationsApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Invitation supprimée");
    },
    onError: onErr,
  });
}
