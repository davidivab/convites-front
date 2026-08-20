import Link from "next/link"
import { MapPin, Package } from "lucide-react"
import { UrgencyBadge } from "@/components/iniciativa/status-badges"
import type { ApiMaterial } from "@/lib/types"
import { CATEGORIAS, type Categoria } from "@/lib/data"
import { formatCOP } from "@/lib/format"

function zonaLabel(m: ApiMaterial): string {
  const mun = m.iniciativa.municipio
  if (mun?.nombre && mun.departamento?.nombre) {
    return `${mun.nombre}, ${mun.departamento.nombre}`
  }
  if (mun?.nombre) return mun.nombre
  return "Sin zona"
}

function categoriaLabel(slug: string | null | undefined): string {
  if (!slug) return "—"
  if (slug in CATEGORIAS) return CATEGORIAS[slug as Categoria]
  return slug
}

export function MaterialCard({ material }: { material: ApiMaterial }) {
  const pct = Math.min(100, Math.max(0, Math.round(material.progreso ?? 0)))
  const ini = material.iniciativa

  return (
    <Link
      href={`/iniciativa/${ini.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
            <Package className="size-3.5" />
            Material
          </span>
          <UrgencyBadge urgencia={ini.urgencia} />
        </div>

        <h3 className="font-serif text-lg leading-snug font-semibold text-balance text-foreground">
          {material.nombre}
        </h3>

        {material.descripcion ? (
          <p className="text-xs text-muted-foreground">{material.descripcion}</p>
        ) : null}

        <p className="text-sm text-muted-foreground">
          Faltan{" "}
          <span className="font-semibold tabular-nums text-foreground">
            {material.faltante}
          </span>{" "}
          {material.unidad}
          <span className="text-muted-foreground/80">
            {" "}
            · {material.cantidad_aportada}/{material.cantidad_meta}
          </span>
        </p>

        {material.valor_unitario_aprox != null ? (
          <p className="-mt-1.5 text-xs tabular-nums text-muted-foreground">
            {formatCOP(material.valor_aportado_aprox ?? 0)} /{" "}
            {formatCOP(material.valor_meta_aprox ?? 0)}
          </p>
        ) : null}

        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-auto space-y-1.5 border-t border-border pt-3">
          <p className="text-sm font-medium text-foreground">{ini.titulo}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5 shrink-0" />
              {zonaLabel(material)}
            </span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
              {categoriaLabel(ini.categoria?.slug)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
