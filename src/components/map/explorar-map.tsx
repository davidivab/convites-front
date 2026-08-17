"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { Iniciativa } from "@/lib/data";
import "leaflet/dist/leaflet.css";

const pinIcon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FitBounds({ points }: { points: Array<[number, number]> }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
  }, [map, points]);
  return null;
}

export function ExplorarMap({ iniciativas }: { iniciativas: Iniciativa[] }) {
  const withCoords = useMemo(
    () =>
      iniciativas.filter(
        (i) => typeof i.lat === "number" && typeof i.lng === "number",
      ),
    [iniciativas],
  );

  const points = withCoords.map((i) => [i.lat!, i.lng!] as [number, number]);

  if (withCoords.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
        Ninguna iniciativa de este filtro tiene punto en el mapa todavía.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <MapContainer
        center={points[0]}
        zoom={11}
        scrollWheelZoom
        className="z-0 h-[min(70vh,560px)] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {withCoords.map((ini) => (
          <Marker
            key={ini.id}
            position={[ini.lat!, ini.lng!]}
            icon={pinIcon}
          >
            <Popup>
              <div className="min-w-40 space-y-1">
                <p className="font-semibold text-sm leading-snug">{ini.titulo}</p>
                <p className="text-xs text-muted-foreground">{ini.zona}</p>
                <Link
                  href={`/iniciativa/${ini.slug}`}
                  className="text-xs font-medium text-primary underline"
                >
                  Ver convite
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <p className="border-t border-border bg-card px-3 py-2 text-xs text-muted-foreground">
        Mapa © OpenStreetMap · {withCoords.length} convite
        {withCoords.length === 1 ? "" : "s"} en el mapa
      </p>
    </div>
  );
}
