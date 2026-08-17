"use client";

import dynamic from "next/dynamic";

const IniciativaMap = dynamic(
  () => import("@/components/iniciativa/iniciativa-map").then((m) => m.IniciativaMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-56 items-center justify-center rounded-2xl border border-border bg-card text-sm text-muted-foreground">
        Cargando mapa…
      </div>
    ),
  },
);

export function IniciativaMapSection({
  lat,
  lng,
  titulo,
}: {
  lat: number;
  lng: number;
  titulo: string;
}) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 font-serif text-xl font-semibold text-foreground">
        Cómo llegar
      </h2>
      <IniciativaMap lat={lat} lng={lng} titulo={titulo} />
    </section>
  );
}
