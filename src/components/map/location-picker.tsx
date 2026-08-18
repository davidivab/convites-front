"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { Crosshair, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

export type MapLocation = {
  lat: number;
  lng: number;
  label?: string;
  fuente: "gps" | "busqueda" | "manual";
};

type GeoHit = {
  label: string;
  lat: number;
  lng: number;
  barrio: string | null;
  municipio: string | null;
};

const PEREIRA: [number, number] = [4.8143, -75.6946];

const pinIcon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 15), { animate: true });
  }, [lat, lng, map]);
  return null;
}

function MapClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPicker({
  value,
  onChange,
  className,
}: {
  value: MapLocation | null;
  onChange: (next: MapLocation | null) => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [label, setLabel] = useState(value?.label ?? "");

  const lat = value?.lat ?? PEREIRA[0];
  const lng = value?.lng ?? PEREIRA[1];

  const applyPoint = useCallback(
    async (
      nextLat: number,
      nextLng: number,
      fuente: MapLocation["fuente"],
      knownLabel?: string,
    ) => {
      let resolved = knownLabel;
      if (!resolved) {
        try {
          const res = await apiFetch<{ data: GeoHit | null }>(
            `/api/geo/reverse?lat=${nextLat}&lng=${nextLng}`,
          );
          resolved = res.data?.label;
        } catch {
          resolved = undefined;
        }
      }
      setLabel(resolved ?? "");
      onChange({
        lat: nextLat,
        lng: nextLng,
        label: resolved,
        fuente,
      });
    },
    [onChange],
  );

  async function buscar() {
    const q = query.trim();
    if (q.length < 3) {
      setGeoError("Escribe al menos 3 letras (barrio o vereda).");
      return;
    }
    setSearching(true);
    setGeoError(null);
    try {
      const res = await apiFetch<{ data: GeoHit[] }>(
        `/api/geo/search?q=${encodeURIComponent(q)}&limit=5`,
      );
      setResults(res.data ?? []);
      if ((res.data ?? []).length === 0) {
        setGeoError("No encontramos ese lugar. Prueba con otro nombre o mueve el pin.");
      }
    } catch {
      setGeoError("No pudimos buscar ahora. Mueve el pin en el mapa.");
    } finally {
      setSearching(false);
    }
  }

  function usarMiUbicacion() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Tu navegador no permite compartir ubicación.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void applyPoint(pos.coords.latitude, pos.coords.longitude, "gps");
      },
      () => {
        setGeoError(
          "No pudimos usar tu ubicación. Puedes buscar el barrio o mover el pin a mano.",
        );
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <Label className="text-base">Marca el punto en el mapa</Label>
        <p className="mt-1 text-sm text-muted-foreground">
          Este es el lugar de encuentro del convite. Puedes usar tu ubicación,
          buscar el barrio o arrastrar el pin.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="secondary"
          className="h-11 gap-2"
          onClick={usarMiUbicacion}
        >
          <Crosshair className="size-4" />
          Usar mi ubicación
        </Button>
        <div className="flex flex-1 gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void buscar();
              }
            }}
            placeholder="Buscar barrio o vereda…"
            className="h-11"
            aria-label="Buscar lugar"
          />
          <Button
            type="button"
            className="h-11 shrink-0 gap-2"
            disabled={searching}
            onClick={() => void buscar()}
          >
            <Search className="size-4" />
            {searching ? "…" : "Buscar"}
          </Button>
        </div>
      </div>

      {results.length > 0 ? (
        <ul className="overflow-hidden rounded-xl border border-border bg-card">
          {results.map((hit) => (
            <li key={`${hit.lat}-${hit.lng}-${hit.label}`}>
              <button
                type="button"
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted"
                onClick={() => {
                  void applyPoint(hit.lat, hit.lng, "busqueda", hit.label);
                  setResults([]);
                  setQuery(hit.municipio || hit.barrio || query);
                }}
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{hit.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {geoError ? (
        <p className="text-sm text-destructive">{geoError}</p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border">
        <MapContainer
          center={[lat, lng]}
          zoom={value ? 15 : 12}
          scrollWheelZoom
          className="z-0 h-[320px] w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler
            onPick={(nextLat, nextLng) => {
              void applyPoint(nextLat, nextLng, "manual");
            }}
          />
          {value ? (
            <>
              <Recenter lat={value.lat} lng={value.lng} />
              <Marker
                position={[value.lat, value.lng]}
                icon={pinIcon}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target as L.Marker;
                    const pos = marker.getLatLng();
                    void applyPoint(pos.lat, pos.lng, "manual");
                  },
                }}
              />
            </>
          ) : null}
        </MapContainer>
      </div>

      <p className="text-sm text-muted-foreground">
        {value ? (
          <>
            <span className="font-medium text-foreground">Punto marcado: </span>
            {label || `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`}
          </>
        ) : (
          "Todavía no hay un punto. Toca el mapa o usa los botones de arriba."
        )}
      </p>
    </div>
  );
}
