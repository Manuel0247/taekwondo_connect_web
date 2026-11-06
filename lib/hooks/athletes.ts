"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { athletesApi } from "../api/endpoints";
import { extractApiError } from "../api-error";
import type { Grade } from "../types";

const onErr = (err: unknown) => toast.error(extractApiError(err));

export const useMyAthleteProfile = () => useQuery({ queryKey: ["athleteMe"], queryFn: athletesApi.me });
export const useAthleteHistorique = () => useQuery({ queryKey: ["athleteHistorique"], queryFn: athletesApi.historique });
export const useAthleteBadges = () => useQuery({ queryKey: ["athleteBadges"], queryFn: athletesApi.badges });
export const useAthleteClassement = () => useQuery({ queryKey: ["athleteClassement"], queryFn: athletesApi.classement });
export const useClubAthletes = () => useQuery({ queryKey: ["clubAthletes"], queryFn: athletesApi.clubAthletes });
export const useClubAthletesPending = () =>
  useQuery({ queryKey: ["clubAthletesPending"], queryFn: athletesApi.clubAthletesPending });

// Le maître crée lui-même le compte d'un athlète ; la page affiche ensuite les identifiants
export function useCreateClubAthlete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: athletesApi.createInClub,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clubAthletes"] });
      toast.success("Athlète ajouté au club");
    },
    onError: onErr,
  });
}

export const useAthleteDetail = (id: string) =>
  useQuery({ queryKey: ["athlete", id], queryFn: () => athletesApi.detail(id), enabled: !!id });

export function useValidateAthlete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: athletesApi.validate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clubAthletesPending"] });
      qc.invalidateQueries({ queryKey: ["clubAthletes"] });
      toast.success("Athlète validé");
    },
    onError: onErr,
  });
}

export function useRejectAthlete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motif }: { id: string; motif: string }) => athletesApi.reject(id, motif),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clubAthletesPending"] });
      toast.success("Demande refusée");
    },
    onError: onErr,
  });
}

export function useUpdateAthleteGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, grade, dan }: { id: string; grade: Grade; dan?: number }) => athletesApi.updateGrade(id, grade, dan),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["clubAthletes"] });
      qc.invalidateQueries({ queryKey: ["athlete", v.id] });
      toast.success("Grade mis à jour");
    },
    onError: onErr,
  });
}

// Nouveau mot de passe provisoire (l'athlète sans email ne peut pas faire « mot de passe oublié »)
export function useResetAthletePassword() {
  return useMutation({ mutationFn: athletesApi.resetPassword, onError: onErr });
}

export function useRemoveAthlete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: athletesApi.remove,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["clubAthletes"] });
      qc.invalidateQueries({ queryKey: ["athlete", id] });
      toast.success("Athlète retiré du club");
    },
    onError: onErr,
  });
}

export function useJoinClub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: athletesApi.joinClub,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["athleteMe"] });
      // Validé directement si le club avait invité cet athlète
      if (res?.statut_club === "valide") {
        toast.success("Bienvenue dans le club !", { description: "Votre invitation a été acceptée" });
      } else {
        toast.success("Demande envoyée", { description: "En attente de validation" });
      }
    },
    onError: onErr,
  });
}

export function useUpdateMyAthlete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: athletesApi.updateMe,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["athleteMe"] });
      toast.success("Profil mis à jour");
    },
    onError: onErr,
  });
}

export function useUpdateAthleteDocuments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: athletesApi.updateDocuments,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["athleteMe"] });
      toast.success("Documents mis à jour");
    },
    onError: onErr,
  });
}

export function useUpdateAthleteDocsByMaitre(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { licence_url?: string; certificat_medical_url?: string }) => athletesApi.updateDocsByMaitre(id, p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["athlete", id] });
      toast.success("Document mis à jour");
    },
    onError: onErr,
  });
}

export function useUpdateAthleteLicenceByMaitre(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { numero_licence?: string; licence_expiration?: string }) => athletesApi.updateLicenceByMaitre(id, p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["athlete", id] });
      toast.success("Informations de licence mises à jour");
    },
    onError: onErr,
  });
}
