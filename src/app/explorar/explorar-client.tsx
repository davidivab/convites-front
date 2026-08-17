"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  List,
  Map,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { CampaignCard } from "@/components/iniciativa/campaign-card";
import { cn } from "@/lib/utils";
import {
  CATEGORIAS,
  URGENCIA_LABEL,
  progresoTotal,
  type Categoria,
  type Iniciativa,
  type Urgencia,
} from "@/lib/data";

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
type Vista = "lista" | "mapa";

type OrdenCampo = "fecha" | "porcentaje" | "nombre";
type OrdenDir = "asc" | "desc";

const ORDEN_CAMPOS: { value: OrdenCampo; label: string }[] = [
  { value: "fecha", label: "Fecha del convite" },
  { value: "porcentaje", label: "Avance (%)" },
  { value: "nombre", label: "Nombre" },
];

export function ExplorarClient({ iniciativas }: { iniciativas: Iniciativa[] }) {
  const [query, setQuery] = useState("");
  const [zona, setZona] = useState<string>("todas");
  const [categoria, setCategoria] = useState<FiltroCategoria>("todas");
  const [urgencia, setUrgencia] = useState<FiltroUrgencia>("todas");
  const [ordenCampo, setOrdenCampo] = useState<OrdenCampo>("fecha");
  const [ordenDir, setOrdenDir] = useState<OrdenDir>("asc");
  const [vista, setVista] = useState<Vista>("lista");

  const zonas = useMemo(
    () => ["todas", ...Array.from(new Set(iniciativas.map((i) => i.zona)))],
    [iniciativas],
  );

  const resultados = useMemo(() => {
    const filtrados = iniciativas.filter((i) => {
      const q = query.trim().toLowerCase();
      const matchQuery =
        q === "" ||
        i.titulo.toLowerCase().includes(q) ||
        i.resumen.toLowerCase().includes(q) ||
        i.zona.toLowerCase().includes(q);
      const matchZona = zona === "todas" || i.zona === zona;
      const matchCat = categoria === "todas" || i.categoria === categoria;
      const matchUrg = urgencia === "todas" || i.urgencia === urgencia;
      return matchQuery && matchZona && matchCat && matchUrg;
    });

    const factor = ordenDir === "asc" ? 1 : -1;

    return [...filtrados].sort((a, b) => {
      let cmp = 0;
      if (ordenCampo === "nombre") {
        cmp = a.titulo.localeCompare(b.titulo, "es", { sensitivity: "base" });
      } else if (ordenCampo === "porcentaje") {
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
  }, [iniciativas, query, zona, categoria, urgencia, ordenCampo, ordenDir]);

  const hayFiltros =
    query !== "" ||
    zona !== "todas" ||
    categoria !== "todas" ||
    urgencia !== "todas";

  function limpiar() {
    setQuery("");
    setZona("todas");
    setCategoria("todas");
    setUrgencia("todas");
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, zona o necesidad…"
            aria-label="Buscar iniciativas"
            className="h-12 rounded-xl pl-11 text-base"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <SlidersHorizontal className="size-4" />
            Filtros
          </div>
          <div className="inline-flex rounded-xl border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setVista("lista")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium",
                vista === "lista"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              <List className="size-4" />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setVista("mapa")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium",
                vista === "mapa"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              <Map className="size-4" />
              Mapa
            </button>
          </div>
        </div>

        <FilterGroup label="Zona">
          {zonas.map((z) => (
            <Chip key={z} active={zona === z} onClick={() => setZona(z)}>
              {z === "todas" ? "Todas las zonas" : z}
            </Chip>
          ))}
        </FilterGroup>
        <FilterGroup label="Categoría">
          <Chip
            active={categoria === "todas"}
            onClick={() => setCategoria("todas")}
          >
            Todas
          </Chip>
          {(Object.keys(CATEGORIAS) as Categoria[]).map((c) => (
            <Chip
              key={c}
              active={categoria === c}
              onClick={() => setCategoria(c)}
            >
              {CATEGORIAS[c]}
            </Chip>
          ))}
        </FilterGroup>
        <FilterGroup label="Urgencia">
          <Chip
            active={urgencia === "todas"}
            onClick={() => setUrgencia("todas")}
          >
            Todas
          </Chip>
          {(Object.keys(URGENCIA_LABEL) as Urgencia[]).map((u) => (
            <Chip key={u} active={urgencia === u} onClick={() => setUrgencia(u)}>
              {URGENCIA_LABEL[u]}
            </Chip>
          ))}
        </FilterGroup>

        {vista === "lista" ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Ordenar por</span>
            {ORDEN_CAMPOS.map((o) => (
              <Chip
                key={o.value}
                active={ordenCampo === o.value}
                onClick={() => setOrdenCampo(o.value)}
              >
                {o.label}
              </Chip>
            ))}
            <button
              type="button"
              onClick={() => setOrdenDir((d) => (d === "asc" ? "desc" : "asc"))}
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-sm"
              aria-label="Cambiar dirección de orden"
            >
              {ordenDir === "asc" ? (
                <ArrowUp className="size-3.5" />
              ) : (
                <ArrowDown className="size-3.5" />
              )}
              {ordenDir === "asc" ? "Ascendente" : "Descendente"}
            </button>
          </div>
        ) : null}

        {hayFiltros && (
          <button
            type="button"
            onClick={limpiar}
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary"
          >
            <X className="size-4" />
            Limpiar filtros
          </button>
        )}

        <p className="text-sm text-muted-foreground">
          {resultados.length} iniciativa{resultados.length === 1 ? "" : "s"}
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
      </div>
    </section>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
