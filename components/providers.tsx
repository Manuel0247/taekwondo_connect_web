"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ConfirmProvider } from "./ui/dialog";
import { useAuthStore } from "@/lib/stores";

let browserQueryClient: QueryClient | undefined;

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      // Mêmes réglages que le mobile (retry 2, données fraîches 5 min)
      queries: {
        retry: (count, err) => {
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status && status >= 400 && status < 500) return false;
          return count < 2;
        },
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
      },
    },
  });
}

function getQueryClient() {
  if (typeof window === "undefined") return makeClient();
  browserQueryClient ??= makeClient();
  return browserQueryClient;
}

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return desktop;
}

export function Providers({ children }: { children: ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  const desktop = useIsDesktop();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <QueryClientProvider client={getQueryClient()}>
      <ConfirmProvider>{children}</ConfirmProvider>
      {/* Toasts : en haut sur smartphone (la barre d'onglets occupe le bas), en bas à droite sur grand écran */}
      <Toaster
        theme="dark"
        position={desktop ? "bottom-right" : "top-center"}
        closeButton
        toastOptions={{
          classNames: {
            toast: "!bg-surface !border !border-line !text-white !rounded-md !font-sans",
            description: "!text-muted",
            success: "!border-l-4 !border-l-secondary",
            error: "!border-l-4 !border-l-danger",
            info: "!border-l-4 !border-l-info-light",
          },
        }}
      />
    </QueryClientProvider>
  );
}
