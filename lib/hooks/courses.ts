"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { athletesApi, coursesApi } from "../api/endpoints";
import { extractApiError } from "../api-error";

const onErr = (err: unknown) => toast.error(extractApiError(err));

export const useMyCourses = () => useQuery({ queryKey: ["myCourses"], queryFn: coursesApi.mine });
export const useClubCourses = (clubId: string) =>
  useQuery({ queryKey: ["clubCourses", clubId], queryFn: () => coursesApi.byClub(clubId), enabled: !!clubId });
export const useCourseDetail = (id: string) =>
  useQuery({ queryKey: ["course", id], queryFn: () => coursesApi.detail(id), enabled: !!id });
export const useCourseReservations = (id: string) =>
  useQuery({ queryKey: ["courseReservations", id], queryFn: () => coursesApi.reservations(id), enabled: !!id });
export const useMyReservations = () => useQuery({ queryKey: ["myReservations"], queryFn: athletesApi.reservations });

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: coursesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myCourses"] });
      toast.success("Cours créé avec succès");
    },
    onError: onErr,
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: coursesApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myCourses"] });
      toast.success("Cours supprimé");
    },
    onError: onErr,
  });
}

export function useReserveCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: coursesApi.reserve,
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["myReservations"] });
      qc.invalidateQueries({ queryKey: ["clubCourses"] });
      // Règle métier 4 : liste d'attente → message avec la position
      if (r?.statut === "liste_attente") {
        toast.info(`Vous êtes en liste d'attente${r.position_attente ? ` (position ${r.position_attente})` : ""}`);
      } else {
        toast.success("Place réservée !");
      }
    },
    onError: onErr,
  });
}

export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: coursesApi.cancelReservation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myReservations"] });
      qc.invalidateQueries({ queryKey: ["clubCourses"] });
      toast.success("Réservation annulée");
    },
    onError: onErr,
  });
}
