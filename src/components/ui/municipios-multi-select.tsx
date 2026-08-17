"use client"

import { useEffect, useMemo, useState } from "react"
import { Label } from "@/components/ui/label"
import { fetchDepartamentos, fetchMunicipios } from "@/lib/convites-api"
import type { ApiDepartamento, ApiMunicipio } from "@/lib/types"
import { cn } from "@/lib/utils"

type Props = {
  value: number[]
  onChange: (ids: number[]) => void
  className?: string
}

/**
 * Multi-select de municipios activos, agrupados por departamento.
 */
export function MunicipiosMultiSelect({ value, onChange, className }: Props) {
  const [departamentos, setDepartamentos] = useState<ApiDepartamento[]>([])
  const [byDept, setByDept] = useState<Record<number, ApiMunicipio[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const depts = await fetchDepartamentos(false)
        if (cancelled) return
        setDepartamentos(depts)
        const entries = await Promise.all(
          depts.map(async (d) => {
            const munis = await fetchMunicipios(d.id, false)
            return [d.id, munis] as const
          }),
        )
        if (cancelled) return
        setByDept(Object.fromEntries(entries))
      } catch {
        if (!cancelled) {
          setDepartamentos([])
          setByDept({})
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const selected = useMemo(() => new Set(value), [value])

  function toggle(id: number) {
    if (selected.has(id)) {
      onChange(value.filter((v) => v !== id))
    } else {
      onChange([...value, id])
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Cargando municipios…</p>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Label>Municipios asignados</Label>
      <p className="text-xs text-muted-foreground">
        Elige al menos uno. Solo aparecen departamentos activos (Risaralda,
        Chocó, Valle del Cauca).
      </p>
      {departamentos.map((d) => {
        const munis = byDept[d.id] ?? []
        if (munis.length === 0) return null
        return (
          <fieldset key={d.id} className="space-y-2">
            <legend className="text-sm font-medium text-foreground">
              {d.nombre}
            </legend>
            <div className="flex flex-wrap gap-2">
              {munis.map((m) => {
                const active = selected.has(m.id)
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggle(m.id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "border-primary bg-primary/10 font-medium text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    {m.nombre}
                  </button>
                )
              })}
            </div>
          </fieldset>
        )
      })}
      {value.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {value.length} municipio{value.length === 1 ? "" : "s"} seleccionado
          {value.length === 1 ? "" : "s"}
        </p>
      ) : null}
    </div>
  )
}
