"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { MapPinned } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchDepartamentos, fetchMunicipios } from "@/lib/convites-api"
import type { AuthUser } from "@/lib/types"

/**
 * Banner for rol voluntario: explains territorial role + assigned municipios.
 */
export function VoluntarioTerritorioBanner({ user }: { user: AuthUser | null }) {
  const isVoluntario = Boolean(user?.roles?.includes("voluntario"))
  const ids = useMemo(() => user?.municipio_ids ?? [], [user?.municipio_ids])
  const [nombres, setNombres] = useState<string[]>([])

  useEffect(() => {
    if (!isVoluntario || ids.length === 0) {
      setNombres([])
      return
    }
    let cancelled = false
    async function load() {
      try {
        const deps = await fetchDepartamentos(false)
        const lists = await Promise.all(
          deps.map((d) => fetchMunicipios(d.id, false)),
        )
        const byId = new Map(
          lists.flat().map((m) => [m.id, m.nombre] as const),
        )
        if (!cancelled) {
          setNombres(
            ids
              .map((id) => byId.get(id))
              .filter((n): n is string => Boolean(n)),
          )
        }
      } catch {
        if (!cancelled) setNombres([])
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [isVoluntario, ids])

  if (!isVoluntario) return null

  return (
    <section className="mb-8 rounded-xl border border-border bg-card/70 p-5">
      <div className="flex items-start gap-3">
        <MapPinned className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 space-y-2">
          <h2 className="font-serif text-xl text-foreground">
            Cuenta de voluntariado territorial
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Puedes aportar y organizar convites como cualquier vecino. No tienes
            cola de moderación: esa tarea es del equipo moderador. Tu vínculo
            territorial ayuda a priorizar acciones en tus municipios.
          </p>
          <p className="text-sm text-foreground">
            <span className="text-muted-foreground">Municipios asignados: </span>
            {nombres.length > 0
              ? nombres.join(", ")
              : ids.length > 0
                ? `${ids.length} municipio(s)`
                : "aún sin asignar — pide a un admin que te vincule"}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" render={<Link href="/explorar" />}>
              Explorar convites
            </Button>
            <Button size="sm" variant="outline" render={<Link href="/crear" />}>
              Crear un convite
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
