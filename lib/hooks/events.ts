"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { athletesApi, eventsApi } from "../api/endpoints";
import { extractApiError } from "../api-error";

const onErr = (err: unknown) => toast.error(extractApiError(err));

export const useEvents = (params?: { type?: string; statut?: string; limit?: number }) =>
  useQuery({ queryKey: ["events", params], queryFn: () => eventsApi.list({ limit: 50, ...params }) });
export const useEventDetail = (id: string) =>
  useQuery({ queryKey: ["event", id], queryFn: () => eventsApi.detail(id), enabled: !!id });
export const useEventInscriptions = (id: string) =>
  useQuery({ queryKey: ["eventInscriptions", id], queryFn: () => eventsApi.inscriptions(id), enabled: !!id });
export const useMyEventInscriptions = () =>
  useQuery({ queryKey: ["myEventInscriptions"], queryFn: athletesApi.inscriptions });

export function useProposeAthletes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, athleteIds }: { eventId: string; athleteIds: string[] }) =>
      eventsApi.propose(eventId, athleteIds),
    onSuccess: (_, v) => {
      // Rafraîchit les inscriptions, le détail (places restantes) et la liste
      qc.invalidateQueries({ queryKey: ["eventInscriptions", v.eventId] });
      qc.invalidateQueries({ queryKey: ["event", v.eventId] });
      qc.invalidateQueries({ queryKey: ["events"] });
      toast.success("Athlètes proposés avec succès");
    },
    onError: onErr,
  });
}

export function useRemoveInscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, inscriptionId }: { eventId: string; inscriptionId: string }) =>
      eventsApi.removeInscription(eventId, inscriptionId),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["eventInscriptions", v.eventId] });
      qc.invalidateQueries({ queryKey: ["event", v.eventId] });
      toast.success("Inscription retirée");
    },
    onError: onErr,
  });
}
