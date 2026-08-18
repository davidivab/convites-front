"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
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
  progresoTotal,
  type Categoria,
  type Iniciativa,
  type Urgencia,
} from "@/lib/data";
import type { ApiMaterial } from "@/lib/types";

const ExplorarMap = dynamic(
  () => import("@/components/map/explorar-map").then((m) => m.ExplorarMap),
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
type OrdenCampo = "fecha" | "porcentaje" | "nombre";
type OrdenDir = "asc" | "desc";

type FiltrosDraft = {
  q: string;
  zona: string;
  categoria: FiltroCategoria;
  urgencia: FiltroUrgencia;
  orden: OrdenCampo;
  dir: OrdenDir;
};

const ORDEN_ITEMS = [
  { value: "fecha", label: "Fecha del convite" },
  { value: "porcentaje", label: "Avance (%)" },
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

const FILTROS_LIMPIOS: FiltrosDraft = {
  q: "",
  zona: "todas",
  categoria: "todas",
  urgencia: "todas",
  orden: "fecha",
  dir: "asc",
};

function materialZona(m: ApiMaterial): string {
  const mun = m.iniciativa.municipio;
  if (mun?.nombre && mun.departamento?.nombre) {
    return `${mun.nombre}, ${mun.departamento.nombre}`;
  }
  if (mun?.nombre) return mun.nombre;
  return "Sin zona";
}

function parseSeccion(raw: string | null): Seccion {
  return raw === "materiales" ? "materiales" : "convites";
}

function parseVista(raw: string | null): Vista {
  return raw === "mapa" ? "mapa" : "lista";
}

function parseCategoria(raw: string | null): FiltroCategoria {
  if (raw && raw in CATEGORIAS) return raw as Categoria;
  return "todas";
}

function parseUrgencia(raw: string | null): FiltroUrgencia {
  if (raw && raw in URGENCIA_LABEL) return raw as Urgencia;
  return "todas";
}

function parseOrden(raw: string | null): OrdenCampo {
  if (raw === "porcentaje" || raw === "nombre" || raw === "fecha") return raw;
  return "fecha";
}

function parseDir(raw: string | null): OrdenDir {
  return raw === "desc" ? "desc" : "asc";
}

function filtrosFromParams(sp: URLSearchParams): FiltrosDraft {
  return {
    q: (sp.get("q") ?? "").trim(),
    zona: sp.get("zona")?.trim() || "todas",
    categoria: parseCategoria(sp.get("categoria")),
    urgencia: parseUrgencia(sp.get("urgencia")),
    orden: parseOrden(sp.get("orden")),
    dir: parseDir(sp.get("dir")),
  };
}

function countFiltrosActivos(
  f: FiltrosDraft,
  opts: { incluirOrden: boolean },
): number {
  let n = 0;
  if (f.q.trim()) n += 1;
  if (f.zona !== "todas") n += 1;
  if (f.categoria !== "todas") n += 1;
  if (f.urgencia !== "todas") n += 1;
  if (opts.incluirOrden) {
    if (f.orden !== "fecha") n += 1;
    if (f.dir !== "asc") n += 1;
  }
  return n;
}

function buildExplorarQuery(opts: {
  seccion: Seccion;
  vista: Vista;
  filtros: FiltrosDraft;
}): string {
  const next = new URLSearchParams();
  if (opts.seccion !== "convites") next.set("seccion", opts.seccion);
  if (opts.vista !== "lista") next.set("vista", opts.vista);

  const q = opts.filtros.q.trim();
  if (q) next.set("q", q);
  if (opts.filtros.zona !== "todas") next.set("zona", opts.filtros.zona);
  if (opts.filtros.categoria !== "todas") {
    next.set("categoria", opts.filtros.categoria);
  }
  if (opts.filtros.urgencia !== "todas") {
    next.set("urgencia", opts.filtros.urgencia);
  }
  if (opts.filtros.orden !== "fecha") next.set("orden", opts.filtros.orden);
  if (opts.filtros.dir !== "asc") next.set("dir", opts.filtros.dir);

  const s = next.toString();
  return s ? `?${s}` : "";
}

export function ExplorarClient(props: {
  iniciativas: Iniciativa[];
  materiales: ApiMaterial[];
}) {
  return (
    <Suspense
      fallback={
        <section className="mx-auto w-full max-w-6xl px-4 py-10 text-sm text-muted-foreground">
          Cargando filtros…
        </section>
      }
    >
      <ExplorarClientInner {...props} />
    </Suspense>
  );
}

function ExplorarClientInner({
  iniciativas,
  materiales,
}: {
  iniciativas: Iniciativa[];
  materiales: ApiMaterial[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const seccion = parseSeccion(searchParams.get("seccion"));
  const vista = parseVista(searchParams.get("vista"));
  const aplicados = useMemo(
    () => filtrosFromParams(searchParams),
    [searchParams],
  );

  const [draft, setDraft] = useState<FiltrosDraft>(aplicados);
  const [drawerOpen, setDrawerOpen] = useState(false);
  /** Búsqueda en barra (fuera del drawer); se aplica con Enter o Filtrar. */
  const [qBarra, setQBarra] = useState(aplicados.q);

  useEffect(() => {
    setDraft(aplicados);
    setQBarra(aplicados.q);
  }, [aplicados]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setDraft(aplicados);
      setQBarra(aplicados.q);
      setDrawerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen, aplicados]);

  const zonas = useMemo(() => {
    const fromIni = iniciativas.map((i) => i.zona);
    const fromMat = materiales.map(materialZona);
    return Array.from(new Set([...fromIni, ...fromMat])).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" }),
    );
  }, [iniciativas, materiales]);

  const zonaItems = useMemo(
    () => [
      { value: "todas", label: "Todas las zonas" },
      ...zonas.map((z) => ({ value: z, label: z })),
    ],
    [zonas],
  );

  const incluirOrden = seccion === "convites" && vista === "lista";
  const activos = countFiltrosActivos(aplicados, { incluirOrden });

  const resultados = useMemo(() => {
    const { q, zona, categoria, urgencia, orden, dir } = aplicados;
    const filtrados = iniciativas.filter((i) => {
      const ql = q.toLowerCase();
      const matchQuery =
        ql === "" ||
        i.titulo.toLowerCase().includes(ql) ||
        i.resumen.toLowerCase().includes(ql) ||
        i.zona.toLowerCase().includes(ql);
      const matchZona = zona === "todas" || i.zona === zona;
      const matchCat = categoria === "todas" || i.categoria === categoria;
      const matchUrg = urgencia === "todas" || i.urgencia === urgencia;
      return matchQuery && matchZona && matchCat && matchUrg;
    });

    const factor = dir === "asc" ? 1 : -1;
    return [...filtrados].sort((a, b) => {
      let cmp = 0;
      if (orden === "nombre") {
        cmp = a.titulo.localeCompare(b.titulo, "es", { sensitivity: "base" });
      } else if (orden === "porcentaje") {
        cmp = progresoTotal(a.items) - progresoTotal(b.items);
      } else {
        const ta = a.fechaISO ? new Date(a.fechaISO).getTime() : null;
        const tb = b.fechaISO ? new Date(b.fechaISO).getTime() : null;
        if (ta === null && tb === null) cmp = 0;
        else if (ta === null) return 1;
        else if (tb === null) return -1;
        else cmp = ta - tb;
      }
      return cmp * factor;
    });
  }, [iniciativas, aplicados]);

  const materialesFiltrados = useMemo(() => {
    const { q, zona, categoria, urgencia } = aplicados;
    const filtrados = materiales.filter((m) => {
      const ql = q.toLowerCase();
      const zonaStr = materialZona(m);
      const matchQuery =
        ql === "" ||
        m.nombre.toLowerCase().includes(ql) ||
        m.iniciativa.titulo.toLowerCase().includes(ql) ||
        zonaStr.toLowerCase().includes(ql);
      const matchZona = zona === "todas" || zonaStr === zona;
      const catSlug = m.iniciativa.categoria?.slug;
      const matchCat =
        categoria === "todas" || (catSlug != null && catSlug === categoria);
      const matchUrg =
        urgencia === "todas" || m.iniciativa.urgencia === urgencia;
      return matchQuery && matchZona && matchCat && matchUrg;
    });

    return [...filtrados].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }),
    );
  }, [materiales, aplicados]);

  function pushState(next: {
    seccion?: Seccion;
    vista?: Vista;
    filtros?: FiltrosDraft;
  }) {
    const qs = buildExplorarQuery({
      seccion: next.seccion ?? seccion,
      vista: next.vista ?? vista,
      filtros: next.filtros ?? aplicados,
    });
    router.push(`${pathname}${qs}`);
  }

  function abrirDrawer() {
    setDraft({ ...aplicados, q: qBarra });
    setDrawerOpen(true);
  }

  function cerrarDrawer() {
    setDraft(aplicados);
    setQBarra(aplicados.q);
    setDrawerOpen(false);
  }

  function aplicarFiltros(filtros?: FiltrosDraft) {
    const next = filtros ?? { ...draft, q: qBarra.trim() };
    pushState({ filtros: next });
    setDrawerOpen(false);
  }

  function limpiar() {
    setDraft(FILTROS_LIMPIOS);
    setQBarra("");
    pushState({ filtros: FILTROS_LIMPIOS });
    setDrawerOpen(false);
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex w-fit rounded-xl border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => pushState({ seccion: "convites" })}
              aria-label="Convites"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium",
                seccion === "convites"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              <Handshake className="size-4" />
              <span className="hidden sm:inline">Convites</span>
            </button>
            <button
              type="button"
              onClick={() => pushState({ seccion: "materiales" })}
              aria-label="Materiales"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium",
                seccion === "materiales"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              <Package className="size-4" />
              <span className="hidden sm:inline">Materiales</span>
            </button>
          </div>

          {seccion === "convites" ? (
            <div className="inline-flex rounded-xl border border-border bg-card p-1">
              <button
                type="button"
                onClick={() => pushState({ vista: "lista" })}
                aria-label="Lista"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium",
                  vista === "lista"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground",
                )}
              >
                <List className="size-4" />
                <span className="hidden sm:inline">Lista</span>
              </button>
              <button
                type="button"
                onClick={() => pushState({ vista: "mapa" })}
                aria-label="Mapa"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium",
                  vista === "mapa"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground",
                )}
              >
                <MapIcon className="size-4" />
                <span className="hidden sm:inline">Mapa</span>
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="explorar-q"
              type="search"
              value={qBarra}
              onChange={(e) => setQBarra(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  aplicarFiltros({ ...aplicados, q: qBarra.trim() });
                }
              }}
              placeholder={
                seccion === "materiales"
                  ? "Material, convite o zona…"
                  : "Nombre, zona o necesidad…"
              }
              aria-label={
                seccion === "materiales"
                  ? "Buscar materiales"
                  : "Buscar iniciativas"
              }
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
              aria-controls="explorar-filtros-drawer"
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

        {seccion === "convites" ? (
          <>
            <p className="text-sm text-muted-foreground">
              {resultados.length} iniciativa
              {resultados.length === 1 ? "" : "s"}
            </p>

            {vista === "mapa" ? (
              <ExplorarMap iniciativas={resultados} />
            ) : resultados.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                No encontramos convites con esos filtros.
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {resultados.map((ini) => (
                  <CampaignCard key={ini.id} iniciativa={ini} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {materialesFiltrados.length} material
              {materialesFiltrados.length === 1 ? "" : "es"} que aún faltan
            </p>
            <p className="text-sm text-muted-foreground">
              ¿Tenés algo de esto? Entrá al convite y ofrecé tu aporte.
            </p>

            {materialesFiltrados.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                No encontramos materiales pendientes con esos filtros.
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {materialesFiltrados.map((m) => (
                  <MaterialCard key={m.id} material={m} />
                ))}
              </div>
            )}
          </>
        )}
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
            id="explorar-filtros-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="explorar-filtros-titulo"
            className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-border bg-background shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2
                id="explorar-filtros-titulo"
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
                <Label htmlFor="explorar-zona">Zona</Label>
                <Select
                  value={draft.zona}
                  onValueChange={(v) => {
                    if (v == null) return;
                    setDraft((d) => ({ ...d, zona: v }));
                  }}
                  items={zonaItems}
                >
                  <SelectTrigger id="explorar-zona" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {zonaItems.map((z) => (
                      <SelectItem key={z.value} value={z.value}>
                        {z.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="explorar-categoria">Categoría</Label>
                <Select
                  value={draft.categoria}
                  onValueChange={(v) => {
                    if (v == null) return;
                    setDraft((d) => ({
                      ...d,
                      categoria: parseCategoria(v),
                    }));
                  }}
                  items={CATEGORIA_ITEMS}
                >
                  <SelectTrigger id="explorar-categoria" className="w-full">
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
                <Label htmlFor="explorar-urgencia">Urgencia</Label>
                <Select
                  value={draft.urgencia}
                  onValueChange={(v) => {
                    if (v == null) return;
                    setDraft((d) => ({
                      ...d,
                      urgencia: parseUrgencia(v),
                    }));
                  }}
                  items={URGENCIA_ITEMS}
                >
                  <SelectTrigger id="explorar-urgencia" className="w-full">
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
                    <Label htmlFor="explorar-orden">Ordenar por</Label>
                    <Select
                      value={draft.orden}
                      onValueChange={(v) => {
                        if (v == null) return;
                        setDraft((d) => ({ ...d, orden: parseOrden(v) }));
                      }}
                      items={[...ORDEN_ITEMS]}
                    >
                      <SelectTrigger id="explorar-orden" className="w-full">
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
                    <Label htmlFor="explorar-dir">Dirección</Label>
                    <Button
                      id="explorar-dir"
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
              <Button
                type="button"
                className="w-full"
                onClick={() =>
                  aplicarFiltros({ ...draft, q: qBarra.trim() })
                }
              >
                Filtrar
              </Button>
              {activos > 0 ||
              draft.zona !== "todas" ||
              draft.categoria !== "todas" ||
              draft.urgencia !== "todas" ? (
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
