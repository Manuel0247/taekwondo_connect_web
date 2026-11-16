"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ordersApi, shopApi } from "../api/endpoints";
import { extractApiError } from "../api-error";
import type { CreateOrderPayload } from "../types";

export const useShopCategories = () => useQuery({ queryKey: ["shopCategories"], queryFn: shopApi.categories });

export const useShopProducts = (params: { category_id?: string; q?: string }) =>
  useQuery({ queryKey: ["shopProducts", params], queryFn: () => shopApi.products(params) });

export const useShopProduct = (id: string) =>
  useQuery({ queryKey: ["shopProduct", id], queryFn: () => shopApi.product(id), enabled: !!id });

export const useMyOrders = () => useQuery({ queryKey: ["myOrders"], queryFn: ordersApi.mine });

export const useOrder = (id: string) =>
  useQuery({ queryKey: ["order", id], queryFn: () => ordersApi.detail(id), enabled: !!id });

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: CreateOrderPayload) => ordersApi.create(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["myOrders"] }),
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ordersApi.cancel,
    onSuccess: (o) => {
      qc.setQueryData(["order", o.id], o);
      qc.invalidateQueries({ queryKey: ["myOrders"] });
      toast.success("Commande annulée");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });
}
