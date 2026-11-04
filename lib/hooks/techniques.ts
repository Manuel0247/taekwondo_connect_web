"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { techniquesApi } from "../api/endpoints";
import { extractApiError } from "../api-error";
import { clearOffline, getLastSync, loadTechniques, saveTechniques, warmImage } from "../offline";
import { storageUrl } from "../utils";
import type { Technique } from "../types";

type Params = { discipline?: string; niveau?: string; q?: string };

export const useTechniques = (p: Params) =>
  useQuery({
    queryKey: ["techniques", p],
    queryFn: () => (p.q ? techniquesApi.search(p.q) : techniquesApi.list({ discipline: p.discipline, niveau: p.niveau })),
    retry: 1,
  });

export const useTechniqueDetail = (id: string) =>
  useQuery({ queryKey: ["technique", id], queryFn: () => techniquesApi.detail(id), enabled: !!id });

export const useFavoriteTechniques = () =>
  useQuery({ queryKey: ["favoriteTechniques"], queryFn: techniquesApi.favoris });

export function useFavoriteIds(): Set<string> {
  const { data } = useFavoriteTechniques();
  return useMemo(() => new Set((data ?? []).map((f) => f.technique_id)), [data]);
}

/** Liste avec est_favori calculé côté client + repli sur la copie hors-ligne */
export function useTechniquesWithFavoris(p: Params) {
  const q = useTechniques(p);
  const favIds = useFavoriteIds();
  // Copie hors-ligne lue seulement si l'API est injoignable
  const offline = useMemo<Technique[] | null>(() => (q.isError ? loadTechniques() : null), [q.isError]);

  const isOfflineMode = q.isError && !!offline;

  const raw: Technique[] = isOfflineMode
    ? offline!.filter((t) => {
        if (p.discipline && t.discipline !== p.discipline) return false;
        if (p.niveau && t.niveau !== p.niveau) return false;
        if (p.q) {
          const s = p.q.toLowerCase();
          return t.nom_fr.toLowerCase().includes(s) || (t.nom_korean ?? "").toLowerCase().includes(s);
        }
        return true;
      })
    : (q.data ?? []);

  // Le filtre « niveau » est appliqué côté client quand la recherche texte est active
  const techniques = raw
    .filter((t) => !p.q || !p.niveau || t.niveau === p.niveau)
    .filter((t) => !p.q || !p.discipline || t.discipline === p.discipline)
    .map((t) => ({ ...t, est_favori: favIds.has(t.id) }));

  return {
    techniques,
    isLoading: q.isLoading,
    isError: q.isError && !isOfflineMode,
    error: q.error,
    refetch: q.refetch,
    isOfflineMode,
  };
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isFavori }: { id: string; isFavori: boolean }) =>
      isFavori ? techniquesApi.removeFavori(id) : techniquesApi.addFavori(id),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["favoriteTechniques"] });
      qc.invalidateQueries({ queryKey: ["technique", v.id] });
      toast.success(v.isFavori ? "Retirée des favoris" : "Ajoutée aux favoris");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });
}

export type SyncStatus = "idle" | "fetching" | "downloading" | "done" | "error";

export function useOfflineSync() {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  // Lu à l'initialisation : ces écrans ne sont rendus que dans le navigateur (session requise)
  const [lastSync, setLastSync] = useState<Date | null>(() => (typeof window === "undefined" ? null : getLastSync()));

  const sync = useCallback(async () => {
    try {
      setStatus("fetching");
      setCurrent(0);
      const list = await techniquesApi.list({ limit: 500 });
      saveTechniques(list);
      const withImg = list.filter((t) => !!t.illustration_url);
      setTotal(withImg.length);
      setStatus("downloading");
      let done = 0;
      for (const t of withImg) {
        const url = storageUrl(t.illustration_url);
        if (url) await warmImage(url);
        done++;
        setCurrent(done);
      }
      setLastSync(new Date());
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }, []);

  const clear = useCallback(() => {
    clearOffline();
    setLastSync(null);
    setStatus("idle");
    toast.success("Copie hors-ligne supprimée");
  }, []);

  return {
    status,
    current,
    total,
    progress: total > 0 ? current / total : 0,
    lastSync,
    isAvailable: !!lastSync,
    isSyncing: status === "fetching" || status === "downloading",
    sync,
    clear,
  };
}
