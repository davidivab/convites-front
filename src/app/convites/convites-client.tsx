"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Handshake,
  List,
  Map as MapIcon,
  Package,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CampaignCard } from "@/components/iniciativa/campaign-card";
import { MaterialCard } from "@/components/iniciativa/material-card";
import { cn } from "@/lib/utils";
import {
  CATEGORIAS,
  URGENCIA_LABEL,
  type Categoria,
  type Iniciativa,
  type Urgencia,
} from "@/lib/data";
import type { ApiMaterial } from "@/lib/types";
import type { PageMeta } from "@/lib/convites-api";
import type { GeoOption, MapaPin } from "./convites-types";

const ConvitesMap = dynamic(
  () => import("@/components/map/convites-map").then((m) => m.ConvitesMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[360px] items-center justify-center rounded-2xl border border-border bg-card text-sm text-muted-foreground">
        Cargando mapa…
      </div>
    ),
  },
);

type FiltroUrgencia = Urgencia | "todas";
type FiltroCategoria = Categoria | "todas";
type Seccion = "convites" | "materiales";
type Vista = "lista" | "mapa";
type OrdenCampo = "fecha" | "avance" | "nombre";
type OrdenDir = "asc" | "desc";

type Applied = {
  seccion: Seccion;
  vista: Vista;
  q: string;
  geo: string;
  categoria: FiltroCategoria | string;
  urgencia: FiltroUrgencia | string;
  orden: OrdenCampo;
  dir: OrdenDir;
  page: number;
};

type Draft = {
  q: string;
  geo: string;
  categoria: string;
  urgencia: string;
  orden: OrdenCampo;
  dir: OrdenDir;
};

const ORDEN_ITEMS = [
  { value: "fecha", label: "Fecha del convite" },
  { value: "avance", label: "Avance (%)" },
  { value: "nombre", label: "Nombre" },
] as const;

const CATEGORIA_ITEMS = [
  { value: "todas", label: "Todas" },
  ...(Object.keys(CATEGORIAS) as Categoria[]).map((c) => ({
    value: c,
    label: CATEGORIAS[c],
  })),
];

const URGENCIA_ITEMS = [
  { value: "todas", label: "Todas" },
  ...(Object.keys(URGENCIA_LABEL) as Urgencia[]).map((u) => ({
    value: u,
    label: URGENCIA_LABEL[u],
  })),
];

function countActivos(a: Applied, incluirOrden: boolean): number {
  let n = 0;
  if (a.q.trim()) n += 1;
  if (a.geo !== "todas") n += 1;
  if (a.categoria !== "todas") n += 1;
  if (a.urgencia !== "todas") n += 1;
  if (incluirOrden) {
    if (a.orden !== "fecha") n += 1;
    if (a.dir !== "asc") n += 1;
  }
  return n;
}

function buildQuery(a: Omit<Applied, "page"> & { page?: number }): string {
  const next = new URLSearchParams();
  if (a.seccion !== "convites") next.set("seccion", a.seccion);
  if (a.vista !== "lista") next.set("vista", a.vista);
  if (a.q.trim()) next.set("q", a.q.trim());
  if (a.geo !== "todas") next.set("geo", a.geo);
  if (a.categoria !== "todas") next.set("categoria", a.categoria);
  if (a.urgencia !== "todas") next.set("urgencia", a.urgencia);
  if (a.orden !== "fecha") next.set("orden", a.orden);
  if (a.dir !== "asc") next.set("dir", a.dir);
  if (a.page && a.page > 1) next.set("page", String(a.page));
  const s = next.toString();
  return s ? `?${s}` : "";
}

export function ConvitesClient({
  iniciativas,
  materiales,
  mapaPins,
  meta,
  geoOptions,
  applied,
}: {
  iniciativas: Iniciativa[];
  materiales: ApiMaterial[];
  mapaPins: MapaPin[];
  meta: PageMeta;
  geoOptions: GeoOption[];
  applied: Applied;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [draft, setDraft] = useState<Draft>({
    q: applied.q,
    geo: applied.geo,
    categoria: applied.categoria,
    urgencia: applied.urgencia,
    orden: applied.orden,
    dir: applied.dir,
  });
  const [qBarra, setQBarra] = useState(applied.q);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDraft({
      q: applied.q,
      geo: applied.geo,
      categoria: applied.categoria,
      urgencia: applied.urgencia,
      orden: applied.orden,
      dir: applied.dir,
    });
    setQBarra(applied.q);
  }, [applied]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setDraft({
        q: applied.q,
        geo: applied.geo,
        categoria: applied.categoria,
        urgencia: applied.urgencia,
        orden: applied.orden,
        dir: applied.dir,
      });
      setQBarra(applied.q);
      setDrawerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen, applied]);

  const incluirOrden = applied.vista === "lista";
  const activos = countActivos(applied, incluirOrden);

  function navigate(next: Partial<Applied>) {
    const merged: Applied = {
      ...applied,
      ...next,
      q: next.q !== undefined ? next.q : applied.q,
    };
    // Al cambiar filtros (no solo page), reset page
    if (
      next.page === undefined &&
      (next.q !== undefined ||
        next.geo !== undefined ||
        next.categoria !== undefined ||
        next.urgencia !== undefined ||
        next.orden !== undefined ||
        next.dir !== undefined ||
        next.seccion !== undefined ||
        next.vista !== undefined)
    ) {
      merged.page = 1;
    }
    router.push(`${pathname}${buildQuery(merged)}`);
  }

  function abrirDrawer() {
    setDraft({
      q: qBarra,
      geo: applied.geo,
      categoria: applied.categoria,
      urgencia: applied.urgencia,
      orden: applied.orden,
      dir: applied.dir,
    });
    setDrawerOpen(true);
  }

  function cerrarDrawer() {
    setDraft({
      q: applied.q,
      geo: applied.geo,
      categoria: applied.categoria,
      urgencia: applied.urgencia,
      orden: applied.orden,
      dir: applied.dir,
    });
    setQBarra(applied.q);
    setDrawerOpen(false);
  }

  function aplicarFiltros() {
    navigate({
      q: qBarra.trim(),
      geo: draft.geo,
      categoria: draft.categoria,
      urgencia: draft.urgencia,
      orden: draft.orden,
      dir: draft.dir,
      page: 1,
    });
    setDrawerOpen(false);
  }

  function limpiar() {
    setQBarra("");
    setDraft({
      q: "",
      geo: "todas",
      categoria: "todas",
      urgencia: "todas",
      orden: "fecha",
      dir: "asc",
    });
    navigate({
      q: "",
      geo: "todas",
      categoria: "todas",
      urgencia: "todas",
      orden: "fecha",
      dir: "asc",
      page: 1,
    });
    setDrawerOpen(false);
  }

  const showPager =
    applied.vista !== "mapa" && meta.last_page > 1;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex w-fit rounded-xl border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => navigate({ seccion: "convites" })}
              aria-label="Convites"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium",
                applied.seccion === "convites"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              <Handshake className="size-4" />
              <span className="hidden sm:inline">Convites</span>
            </button>
            <button
              type="button"
              onClick={() => navigate({ seccion: "materiales" })}
              aria-label="Materiales"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium",
                applied.seccion === "materiales"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              <Package className="size-4" />
              <span className="hidden sm:inline">Materiales</span>
            </button>
          </div>

          <div className="inline-flex rounded-xl border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => navigate({ vista: "lista" })}
              aria-label="Lista"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium",
                applied.vista === "lista"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              <List className="size-4" />
              <span className="hidden sm:inline">Lista</span>
            </button>
            <button
              type="button"
              onClick={() => navigate({ vista: "mapa" })}
              aria-label="Mapa"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium",
                applied.vista === "mapa"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              <MapIcon className="size-4" />
              <span className="hidden sm:inline">Mapa</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={qBarra}
              onChange={(e) => setQBarra(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  navigate({ q: qBarra.trim(), page: 1 });
                }
              }}
              placeholder={
                applied.seccion === "materiales"
                  ? "Material, convite o zona…"
                  : "Nombre, zona o necesidad…"
              }
              aria-label="Buscar"
              className="h-11 pl-9"
            />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="relative"
              onClick={abrirDrawer}
              aria-expanded={drawerOpen}
              aria-controls="convites-filtros-drawer"
            >
              <SlidersHorizontal className="size-4" />
              Filtros
              {activos > 0 ? (
                <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                  {activos}
                </span>
              ) : null}
            </Button>
            {activos > 0 ? (
              <Button type="button" variant="ghost" size="sm" onClick={limpiar}>
                <X className="size-4" />
                Limpiar
              </Button>
            ) : null}
          </div>
        </div>

        {applied.seccion === "convites" ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {applied.vista === "mapa"
                  ? `${mapaPins.length} convite${mapaPins.length === 1 ? "" : "s"} en el mapa`
                  : `${meta.total} iniciativa${meta.total === 1 ? "" : "s"}`}
                {showPager
                  ? ` · página ${meta.current_page} de ${meta.last_page}`
                  : null}
              </p>
              <Button
                size="sm"
                className="shrink-0"
                render={<Link href="/crear" />}
              >
                Crear mi propio convite
              </Button>
            </div>

            {applied.vista === "mapa" ? (
              <ConvitesMap pins={mapaPins} />
            ) : iniciativas.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                No encontramos convites con esos filtros.
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {iniciativas.map((ini) => (
                  <CampaignCard key={ini.id} iniciativa={ini} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {applied.vista === "mapa"
                ? `${mapaPins.length} convite${mapaPins.length === 1 ? "" : "s"} con materiales en el mapa`
                : `${meta.total} material${meta.total === 1 ? "" : "es"} que aún faltan`}
              {showPager
                ? ` · página ${meta.current_page} de ${meta.last_page}`
                : null}
            </p>
            {applied.vista === "lista" ? (
              <p className="text-sm text-muted-foreground">
                ¿Tienes algo de esto? Entra al convite y ofrece tu aporte.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Cada pin es un convite que todavía pide alguno de esos materiales.
              </p>
            )}

            {applied.vista === "mapa" ? (
              <ConvitesMap pins={mapaPins} />
            ) : materiales.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                No encontramos materiales pendientes con esos filtros.
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {materiales.map((m) => (
                  <MaterialCard key={m.id} material={m} />
                ))}
              </div>
            )}
          </>
        )}

        {showPager ? (
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.current_page <= 1}
              onClick={() => navigate({ page: meta.current_page - 1 })}
            >
              <ChevronLeft className="size-4" />
              Anterior
            </Button>
            <span className="text-sm tabular-nums text-muted-foreground">
              {meta.current_page} / {meta.last_page}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => navigate({ page: meta.current_page + 1 })}
            >
              Siguiente
              <ChevronRight className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40"
            aria-label="Cerrar filtros"
            onClick={cerrarDrawer}
          />
          <aside
            id="convites-filtros-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="convites-filtros-titulo"
            className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-border bg-background shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2
                id="convites-filtros-titulo"
                className="font-serif text-lg font-semibold text-foreground"
              >
                Filtros
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={cerrarDrawer}
                aria-label="Cerrar"
              >
                <X className="size-5" />
              </Button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="convites-geo">Zona</Label>
                <Select
                  value={draft.geo}
                  onValueChange={(v) => {
                    if (v == null) return;
                    setDraft((d) => ({ ...d, geo: v }));
                  }}
                  items={geoOptions}
                >
                  <SelectTrigger id="convites-geo" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {geoOptions.map((z) => (
                      <SelectItem key={z.value} value={z.value}>
                        {z.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="convites-categoria">Categoría</Label>
                <Select
                  value={draft.categoria}
                  onValueChange={(v) => {
                    if (v == null) return;
                    setDraft((d) => ({ ...d, categoria: v }));
                  }}
                  items={CATEGORIA_ITEMS}
                >
                  <SelectTrigger id="convites-categoria" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIA_ITEMS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="convites-urgencia">Urgencia</Label>
                <Select
                  value={draft.urgencia}
                  onValueChange={(v) => {
                    if (v == null) return;
                    setDraft((d) => ({ ...d, urgencia: v }));
                  }}
                  items={URGENCIA_ITEMS}
                >
                  <SelectTrigger id="convites-urgencia" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {URGENCIA_ITEMS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {incluirOrden ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="convites-orden">Ordenar por</Label>
                    <Select
                      value={draft.orden}
                      onValueChange={(v) => {
                        if (v == null) return;
                        if (v === "fecha" || v === "avance" || v === "nombre") {
                          setDraft((d) => ({ ...d, orden: v }));
                        }
                      }}
                      items={[...ORDEN_ITEMS]}
                    >
                      <SelectTrigger id="convites-orden" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDEN_ITEMS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="convites-dir">Dirección</Label>
                    <Button
                      id="convites-dir"
                      type="button"
                      variant="outline"
                      className="h-9 w-full justify-start"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          dir: d.dir === "asc" ? "desc" : "asc",
                        }))
                      }
                    >
                      {draft.dir === "asc" ? (
                        <ArrowUp className="size-4" />
                      ) : (
                        <ArrowDown className="size-4" />
                      )}
                      {draft.dir === "asc" ? "Ascendente" : "Descendente"}
                    </Button>
                  </div>
                </>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 border-t border-border p-4">
              <Button type="button" className="w-full" onClick={aplicarFiltros}>
                Filtrar
              </Button>
              {activos > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={limpiar}
                >
                  Limpiar filtros
                </Button>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
