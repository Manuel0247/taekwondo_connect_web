"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { LocateFixed, Navigation } from "lucide-react";
import { toast } from "sonner";
import { ABIDJAN, COLORS } from "@/lib/config";
import { cn, formatPrice } from "@/lib/utils";
import { Spinner } from "../ui/spinner";

// Tuiles OpenStreetMap standard (sans clé d'API), comme src/components/map/LeafletMap.tsx du mobile
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// Épingle identique au mobile : goutte colorée, contour blanc, rond blanc central
function pinIcon(color: string = COLORS.primary, selected = false) {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 30 42">' +
    `<path d="M15 0C6.7 0 0 6.7 0 15c0 11.2 15 27 15 27s15-15.8 15-27C30 6.7 23.3 0 15 0z" fill="${color}" stroke="#fff" stroke-width="2"/>` +
    '<circle cx="15" cy="15" r="5.5" fill="#fff"/></svg>';
  return L.divIcon({
    className: cn("lcc-pin", selected && "lcc-pin-selected"),
    html: svg,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -38],
  });
}

// Point bleu de position (comme le mobile)
const meIcon = L.divIcon({ className: "lcc-dot", html: '<div class="lcc-dot-inner"></div>', iconSize: [16, 16], iconAnchor: [8, 8] });

type LatLng = { latitude: number; longitude: number };

function useGeolocation() {
  const [locating, setLocating] = useState(false);
  const locate = (onOk: (p: LatLng) => void, silent = false) => {
    if (!("geolocation" in navigator)) {
      if (!silent) toast.error("Géolocalisation non disponible sur cet appareil");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onOk({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      (err) => {
        setLocating(false);
        if (silent) return;
        toast.error(
          err.code === err.PERMISSION_DENIED ? "Permission refusée" : "Impossible d'obtenir la position",
          err.code === err.PERMISSION_DENIED ? { description: "Autorisez la localisation dans votre navigateur" } : undefined,
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };
  return { locating, locate };
}

function LocateButton({ onClick, locating, label = "Ma position" }: { onClick: () => void; locating: boolean; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locating}
      className="absolute right-3 bottom-3 z-[500] grid size-11 place-items-center rounded-full border border-line bg-surface text-info-light shadow-lg transition-colors hover:bg-surface-3"
      aria-label={label}
      title={label}
    >
      {locating ? <Spinner className="size-5" /> : <LocateFixed className="size-5" />}
    </button>
  );
}

function FlyTo({ target, zoom }: { target: LatLng | null; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.latitude, target.longitude], zoom, { duration: 0.6 });
  }, [target, zoom, map]);
  return null;
}

// ── Carte des clubs ─────────────────────────────────────────────────────────

export type MapClub = { id: string; nom: string; ville: string; prix_mensuel?: number | null; latitude: number; longitude: number };

function FitClubs({ clubs, focusId }: { clubs: MapClub[]; focusId?: string | null }) {
  const map = useMap();
  const key = clubs.map((c) => c.id).join(",");
  useEffect(() => {
    if (!clubs.length) return;
    if (clubs.length === 1) map.setView([clubs[0].latitude, clubs[0].longitude], 14);
    else map.fitBounds(L.latLngBounds(clubs.map((c) => [c.latitude, c.longitude])), { padding: [48, 48], maxZoom: 14 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  useEffect(() => {
    const c = clubs.find((x) => x.id === focusId);
    if (c) map.flyTo([c.latitude, c.longitude], Math.max(map.getZoom(), 14), { duration: 0.5 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, map]);
  // La carte peut changer de taille (bascule liste/carte, panneau latéral)
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  return null;
}

export function ClubsMap({
  clubs,
  hrefFor,
  focusId,
  onSelect,
  className,
}: {
  clubs: MapClub[];
  hrefFor: (id: string) => string;
  focusId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  const [me, setMe] = useState<LatLng | null>(null);
  const [flyTarget, setFlyTarget] = useState<LatLng | null>(null);
  const { locating, locate } = useGeolocation();
  const markers = useRef<Record<string, L.Marker | null>>({});

  // Position récupérée silencieusement à l'ouverture (point bleu, sans zoom) — comme le mobile
  useEffect(() => {
    locate(setMe, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (focusId) markers.current[focusId]?.openPopup();
  }, [focusId]);

  return (
    <div className={cn("relative isolate overflow-hidden", className)}>
      <MapContainer center={ABIDJAN} zoom={12} className="h-full w-full" scrollWheelZoom>
        <TileLayer url={TILE_URL} attribution={ATTRIBUTION} maxZoom={19} />
        <FitClubs clubs={clubs} focusId={focusId} />
        <FlyTo target={flyTarget} zoom={13} />
        {me && <Marker position={[me.latitude, me.longitude]} icon={meIcon} interactive={false} />}
        {clubs.map((c) => (
          <Marker
            key={c.id}
            position={[c.latitude, c.longitude]}
            icon={pinIcon(c.id === focusId ? COLORS.secondary : COLORS.primary, c.id === focusId)}
            zIndexOffset={c.id === focusId ? 1000 : 0}
            ref={(m) => {
              markers.current[c.id] = m;
            }}
            eventHandlers={{ click: () => onSelect?.(c.id) }}
          >
            <Popup>
              <div className="min-w-[180px]">
                <p className="text-sm font-extrabold text-white">{c.nom}</p>
                <p className="text-xs text-muted">{c.ville}</p>
                {formatPrice(c.prix_mensuel) && (
                  <p className="mt-1 text-xs font-bold text-secondary-light">{formatPrice(c.prix_mensuel)}/mois</p>
                )}
                <Link href={hrefFor(c.id)} className="mt-2 inline-block text-xs font-bold !text-primary hover:underline">
                  Voir le club →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <LocateButton
        locating={locating}
        onClick={() =>
          locate((p) => {
            setMe(p);
            setFlyTarget({ ...p });
          })
        }
      />
    </div>
  );
}

// ── Carte de localisation (lecture seule) — équivalent de ClubMap.tsx ───────

export function LocationMap({ latitude, longitude, title, className }: LatLng & { title?: string; className?: string }) {
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  return (
    <div className={cn("relative isolate overflow-hidden rounded-lg border border-line", className)}>
      <MapContainer center={[latitude, longitude]} zoom={15} className="h-full w-full" scrollWheelZoom={false}>
        <TileLayer url={TILE_URL} attribution={ATTRIBUTION} maxZoom={19} />
        <Marker position={[latitude, longitude]} icon={pinIcon()}>
          {title && (
            <Popup>
              <p className="text-sm font-bold text-white">{title}</p>
            </Popup>
          )}
        </Marker>
      </MapContainer>
      <a
        href={directions}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-3 bottom-3 z-[500] inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-bold text-white shadow-lg hover:bg-surface-3"
      >
        <Navigation className="size-3.5 text-primary" />
        Itinéraire
      </a>
    </div>
  );
}

// ── Sélecteur de position (inscription club, édition des infos) ─────────────

function ClickToPlace({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({ click: (e) => onPick({ latitude: e.latlng.lat, longitude: e.latlng.lng }) });
  return null;
}

export function LocationPicker({
  value,
  onChange,
  autoLocate = false,
  className,
}: {
  value: LatLng | null;
  onChange: (p: LatLng) => void;
  autoLocate?: boolean;
  className?: string;
}) {
  const { locating, locate } = useGeolocation();
  const [flyTarget, setFlyTarget] = useState<LatLng | null>(null);
  const center = useMemo<[number, number]>(
    () => (value ? [value.latitude, value.longitude] : ABIDJAN),
    // centre initial uniquement
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const placeAtMyPosition = (silent = false) =>
    locate((p) => {
      onChange(p);
      setFlyTarget({ ...p });
    }, silent);

  useEffect(() => {
    if (autoLocate && !value) placeAtMyPosition(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cn("relative isolate overflow-hidden rounded-lg border border-line", className)}>
      <MapContainer center={center} zoom={value ? 16 : 12} className="h-full w-full" scrollWheelZoom>
        <TileLayer url={TILE_URL} attribution={ATTRIBUTION} maxZoom={19} />
        <ClickToPlace onPick={onChange} />
        <FlyTo target={flyTarget} zoom={16} />
        {value && (
          <Marker
            position={[value.latitude, value.longitude]}
            icon={pinIcon()}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const ll = (e.target as L.Marker).getLatLng();
                onChange({ latitude: ll.lat, longitude: ll.lng });
              },
            }}
          />
        )}
      </MapContainer>
      {!value && !locating && (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-[500] flex justify-center px-4">
          <p className="rounded-full border border-line bg-surface/95 px-4 py-2 text-center text-xs font-semibold text-white shadow-lg">
            Cliquez sur la carte pour placer votre club
          </p>
        </div>
      )}
      <LocateButton locating={locating} onClick={() => placeAtMyPosition(false)} label="Utiliser ma position" />
    </div>
  );
}
