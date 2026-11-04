"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clubsApi, type ClubFilters } from "../api/endpoints";
import { extractApiError } from "../api-error";

const onErr = (err: unknown) => toast.error(extractApiError(err));

export function useClubs(filters: ClubFilters) {
  return useInfiniteQuery({
    queryKey: ["clubs", filters],
    queryFn: ({ pageParam }) => clubsApi.list({ ...filters, limit: 20, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.lastPage ? last.page + 1 : undefined),
  });
}

export const useClubDetail = (id: string) =>
  useQuery({ queryKey: ["club", id], queryFn: () => clubsApi.detail(id), enabled: !!id });

export const useMyClub = () => useQuery({ queryKey: ["myClub"], queryFn: clubsApi.me });
export const useClubDocuments = () => useQuery({ queryKey: ["clubDocuments"], queryFn: clubsApi.documents });

export function useUpdateMyClub(successMessage = "Club mis à jour") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clubsApi.updateMe,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myClub"] });
      toast.success(successMessage);
    },
    onError: onErr,
  });
}

export function useUpdateClubPhotos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clubsApi.updatePhotos,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myClub"] });
      toast.success("Photos mises à jour");
    },
    onError: onErr,
  });
}

export function useUpdateHoraires() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clubsApi.updateHoraires,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myClub"] });
      toast.success("Horaires mis à jour");
    },
    onError: onErr,
  });
}

export function useUploadClubDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clubsApi.uploadDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clubDocuments"] });
      toast.success("Document ajouté");
    },
    onError: onErr,
  });
}

export function useDeleteClubDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clubsApi.deleteDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clubDocuments"] });
      toast.success("Document supprimé");
    },
    onError: onErr,
  });
}
