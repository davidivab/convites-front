"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type ExplorarMapPin = {
  id: string;
  slug: string;
  titulo: string;
  lat: number;
  lng: number;
  zona?: string;
};

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

export function ExplorarMap({ pins }: { pins: ExplorarMapPin[] }) {
  const points = useMemo(
    () => pins.map((p) => [p.lat, p.lng] as [number, number]),
    [pins],
  );

  if (pins.length === 0) {
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
        {pins.map((pin) => (
          <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={pinIcon}>
            <Popup>
              <div className="min-w-40 space-y-1">
                <p className="text-sm leading-snug font-semibold">{pin.titulo}</p>
                {pin.zona ? (
                  <p className="text-xs text-muted-foreground">{pin.zona}</p>
                ) : null}
                <Link
                  href={`/iniciativa/${pin.slug}`}
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
        Mapa © OpenStreetMap · {pins.length} convite
        {pins.length === 1 ? "" : "s"} en el mapa
      </p>
    </div>
  );
}
