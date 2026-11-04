"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

// Leaflet dépend de window : chargé uniquement côté navigateur
function MapFallback({ className }: { className?: string }) {
  return (
    <div className={cn("grid animate-pulse place-items-center rounded-lg border border-line bg-surface text-muted", className)}>
      <MapPin className="size-8" strokeWidth={1.5} />
    </div>
  );
}

export const ClubsMap = dynamic(() => import("./leaflet-maps").then((m) => m.ClubsMap), {
  ssr: false,
  loading: () => <MapFallback className="h-full w-full rounded-none border-0" />,
});

export const LocationMap = dynamic(() => import("./leaflet-maps").then((m) => m.LocationMap), {
  ssr: false,
  loading: () => <MapFallback className="h-56 w-full sm:h-64" />,
});

export const LocationPicker = dynamic(() => import("./leaflet-maps").then((m) => m.LocationPicker), {
  ssr: false,
  loading: () => <MapFallback className="h-full w-full" />,
});

export type { MapClub } from "./leaflet-maps";
