"use client"

import { useMemo, useState } from "react"
import {
  TIPO_CENTRO,
  ESTADO_CENTRO_LABEL,
  type Centro,
  type TipoCentro,
  type EstadoCentro,
} from "@/lib/data"
import {
  Package,
  BedDouble,
  Flame,
  Cross,
  Shield,
  LifeBuoy,
  ClipboardList,
  MapPin,
  Phone,
  Clock,
  Check,
  X,
  Users,
  Navigation,
  ExternalLink,
  Search,
  SlidersHorizontal,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { PageIntroSection } from "@/components/layout/page-intro-section"
import { cn } from "@/lib/utils"

const TIPO_ICON: Record<TipoCentro, typeof Package> = {
  acopio: Package,
  albergue: BedDouble,
  bomberos: Flame,
  hospital: Cross,
  policia: Shield,
  "defensa-civil": LifeBuoy,
  censo: ClipboardList,
}

const ORDEN: TipoCentro[] = [
  "censo",
  "acopio",
  "albergue",
  "hospital",
  "bomberos",
  "policia",
  "defensa-civil",
]

function EstadoPill({ estado }: { estado: EstadoCentro }) {
  const tone =
    estado === "abierto" || estado === "24h"
      ? "bg-primary/10 text-primary"
      : estado === "lleno"
        ? "bg-destructive/10 text-destructive"
        : "bg-muted text-muted-foreground"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        tone,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {ESTADO_CENTRO_LABEL[estado]}
    </span>
  )
}

export function CentrosClient({ centros: iniciales }: { centros: Centro[] }) {
  const [filtro, setFiltro] = useState<TipoCentro | "todos">("todos")
  const [query, setQuery] = useState("")
  const [zona, setZona] = useState<string>("todas")
  const [estado, setEstado] = useState<EstadoCentro | "todos">("todos")

  const tipos = ORDEN.filter((t) => iniciales.some((c) => c.tipo === t))

  const zonas = useMemo(
    () =>
      Array.from(new Set(iniciales.map((c) => c.zona).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b, "es"),
      ),
    [iniciales],
  )
  const estados = useMemo(
    () => Array.from(new Set(iniciales.map((c) => c.estado))),
    [iniciales],
  )

  const centros = useMemo(() => {
    const q = query.trim().toLowerCase()
    return iniciales.filter((c) => {
      const matchTipo = filtro === "todos" || c.tipo === filtro
      const matchZona = zona === "todas" || c.zona === zona
      const matchEstado = estado === "todos" || c.estado === estado
      const matchQuery =
        q === "" ||
        c.nombre.toLowerCase().includes(q) ||
        c.descripcion.toLowerCase().includes(q) ||
        c.zona.toLowerCase().includes(q) ||
        c.direccion.toLowerCase().includes(q) ||
        (c.necesita ?? []).some((n) => n.toLowerCase().includes(q))
      return matchTipo && matchZona && matchEstado && matchQuery
    })
  }, [iniciales, filtro, zona, estado, query])

  const hayFiltros = filtro !== "todos" || zona !== "todas" || estado !== "todos" || query.trim() !== ""

  const portalCenso = useMemo(
    () =>
      centros.find(
        (c) =>
          c.tipo === "censo" &&
          Boolean(c.urlExterna) &&
          c.nombre.toLowerCase().includes("portal"),
      ) ?? null,
    [centros],
  )

  const centrosLista = useMemo(() => {
    if (!portalCenso) return centros
    return centros.filter((c) => c.id !== portalCenso.id)
  }, [centros, portalCenso])

  function limpiar() {
    setFiltro("todos")
    setZona("todas")
    setEstado("todos")
    setQuery("")
  }

  return (
    <>
      <PageIntroSection
        title="Lugares de ayuda en Colombia"
        eyebrow="Directorio de emergencia"
        className="bg-secondary/40"
        description={
          <>
            Dónde llevar donaciones, buscar refugio o pedir ayuda urgente. Antes
            de desplazarte, confirma horarios y cupos por teléfono: la situación
            cambia hora a hora.
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
          <Phone className="size-4 text-destructive" />
          <span className="text-sm text-foreground">
            Emergencias: <strong>Bomberos 119</strong> ·{" "}
            <strong>Policía 123</strong> · <strong>Ambulancias 125</strong>
          </span>
        </div>
      </PageIntroSection>

      <section className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, zona, dirección o qué se necesita…"
              className="h-11 pl-10"
              aria-label="Buscar centros"
            />
          </div>
          <select
            value={zona}
            onChange={(e) => setZona(e.target.value)}
            aria-label="Filtrar por zona"
            className="h-11 rounded-md border border-border bg-card px-3 text-sm text-foreground"
          >
            <option value="todas">Todas las zonas</option>
            {zonas.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoCentro | "todos")}
            aria-label="Filtrar por estado"
            className="h-11 rounded-md border border-border bg-card px-3 text-sm text-foreground"
          >
            <option value="todos">Cualquier estado</option>
            {estados.map((e) => (
              <option key={e} value={e}>
                {ESTADO_CENTRO_LABEL[e]}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por tipo">
          <FilterChip active={filtro === "todos"} onClick={() => setFiltro("todos")}>
            Todos
          </FilterChip>
          {tipos.map((t) => {
            const Icon = TIPO_ICON[t]
            return (
              <FilterChip key={t} active={filtro === t} onClick={() => setFiltro(t)}>
                <Icon className="size-3.5" />
                {TIPO_CENTRO[t].plural}
              </FilterChip>
            )
          })}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {centros.length} {centros.length === 1 ? "punto encontrado" : "puntos encontrados"}
          </p>
          {hayFiltros && (
            <button
              type="button"
              onClick={limpiar}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <SlidersHorizontal className="size-3.5" />
              Limpiar filtros
            </button>
          )}
        </div>

        {centros.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
            <p className="font-serif text-lg text-foreground">No encontramos puntos con esos filtros</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Prueba con otra búsqueda o quita algún filtro.
            </p>
          </div>
        ) : (
          <>
            {portalCenso && (
              <a
                href={portalCenso.urlExterna ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5 transition-colors hover:border-primary/50 hover:bg-primary/10 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">
                    Vía principal · Alcaldía de Pereira
                  </p>
                  <h2 className="mt-1 font-serif text-xl text-foreground text-balance">
                    {portalCenso.nombre}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Reporta afectaciones en inmuebles en línea. Los puntos presenciales sirven si no
                    tienes conectividad.
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
                  <ExternalLink className="size-3.5" />
                  Ir a sospereira.com
                </span>
              </a>
            )}

            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {centrosLista.map((c) => {
                const Icon = TIPO_ICON[c.tipo]
                return (
                  <article
                    key={c.id}
                    className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </span>
                      <EstadoPill estado={c.estado} />
                    </div>

                    <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {TIPO_CENTRO[c.tipo].label}
                    </p>
                    <h2 className="mt-1 font-serif text-xl leading-snug text-foreground text-balance">
                      {c.nombre}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {c.descripcion}
                    </p>

                    <dl className="mt-4 space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <span className="text-foreground/80">
                          {c.direccion}
                          {c.zona ? ` · ${c.zona}` : ""}
                        </span>
                      </div>
                      {c.horario ? (
                        <div className="flex items-start gap-2">
                          <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          <span className="text-foreground/80">{c.horario}</span>
                        </div>
                      ) : null}
                      {c.telefono ? (
                        <div className="flex items-start gap-2">
                          <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          <a
                            href={`tel:${c.telefono.replace(/\s/g, "")}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {c.telefono}
                          </a>
                        </div>
                      ) : null}
                      {c.urlExterna ? (
                        <div className="flex items-start gap-2">
                          <ExternalLink className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          <a
                            href={c.urlExterna}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline"
                          >
                            Reportar en sospereira.com
                          </a>
                        </div>
                      ) : null}
                    </dl>

                    {c.tipo !== "censo" || c.direccion !== "Reporte en línea" ? (
                      (() => {
                        const consulta = encodeURIComponent(
                          `${c.nombre}, ${c.direccion}${c.zona ? `, ${c.zona}` : ""}`,
                        )
                        const wazeUrl = `https://waze.com/ul?q=${consulta}&navigate=yes`
                        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${consulta}`
                        return (
                          <div className="mt-4 grid grid-cols-2 gap-2">
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                            >
                              <ExternalLink className="size-3.5" />
                              Google Maps
                            </a>
                            <a
                              href={wazeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                            >
                              <Navigation className="size-3.5" />
                              Waze
                            </a>
                          </div>
                        )
                      })()
                    ) : null}

                    {c.capacidad && (
                      <div className="mt-4 rounded-xl bg-muted/50 p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Users className="size-4" /> Cupos
                          </span>
                          <span className="font-medium text-foreground">
                            {c.capacidad.ocupado} / {c.capacidad.total}
                          </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              c.capacidad.ocupado >= c.capacidad.total
                                ? "bg-destructive"
                                : "bg-primary",
                            )}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round((c.capacidad.ocupado / c.capacidad.total) * 100),
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {c.necesita && (
                      <div className="mt-4 space-y-3">
                        <div>
                          <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                            <Check className="size-3.5 text-primary" /> Se necesita
                          </p>
                          <ul className="mt-1.5 flex flex-wrap gap-1.5">
                            {c.necesita.map((n) => (
                              <li
                                key={n}
                                className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary"
                              >
                                {n}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {c.noRecibe && (
                          <div>
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                              <X className="size-3.5 text-muted-foreground" /> No recibe
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {c.noRecibe.join(" · ")}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </>
        )}
      </section>
    </>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}
