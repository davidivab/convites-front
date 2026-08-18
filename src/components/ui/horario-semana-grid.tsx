"use client"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const DIAS = [
  { key: "lun", label: "Lunes" },
  { key: "mar", label: "Martes" },
  { key: "mie", label: "Miércoles" },
  { key: "jue", label: "Jueves" },
  { key: "vie", label: "Viernes" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
] as const

const FRANJAS = [
  { key: "manana", label: "Mañana" },
  { key: "tarde", label: "Tarde" },
  { key: "noche", label: "Noche" },
] as const

type DiaKey = (typeof DIAS)[number]["key"]
type FranjaKey = (typeof FRANJAS)[number]["key"]
type CellKey = `${DiaKey}:${FranjaKey}`

function cellKey(dia: DiaKey, franja: FranjaKey): CellKey {
  return `${dia}:${franja}`
}

/** Serializa la grilla a texto corto para el API (`horario`, máx ~180). */
export function serializeHorarioSemana(selected: ReadonlySet<string>): string {
  if (selected.size === 0) return ""
  const parts: string[] = []
  for (const dia of DIAS) {
    const franjas = FRANJAS.filter((f) =>
      selected.has(cellKey(dia.key, f.key)),
    ).map((f) => f.label.toLowerCase())
    if (franjas.length === 0) continue
    parts.push(`${dia.label.slice(0, 3)} ${franjas.join("/")}`)
  }
  return parts.join("; ")
}

/** Intenta recuperar la grilla desde el texto guardado (best-effort). */
export function parseHorarioSemana(value: string): Set<string> {
  const selected = new Set<string>()
  if (!value.trim()) return selected

  const normalized = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")

  for (const dia of DIAS) {
    const diaNorm = dia.label
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
    const abbr = diaNorm.slice(0, 3)
    const dayHit =
      normalized.includes(diaNorm) ||
      new RegExp(`(?:^|[;,]\\s*)${abbr}\\b`).test(normalized)
    if (!dayHit) continue

    const segmentMatch = normalized.match(
      new RegExp(`(?:${diaNorm}|${abbr})[:\\s]+([^;]+)`),
    )
    const segment = segmentMatch?.[1] ?? normalized

    for (const franja of FRANJAS) {
      const fNorm = franja.label
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
      if (segment.includes(fNorm) || segment.includes(franja.key)) {
        selected.add(cellKey(dia.key, franja.key))
      }
    }
  }

  return selected
}

type Props = {
  id?: string
  label?: string
  value: string
  onChange: (value: string) => void
  className?: string
}

/**
 * Horario de punto de recolección: filas = días, columnas = mañana / tarde / noche.
 * El checkbox del día marca o desmarca toda la fila.
 */
export function HorarioSemanaGrid({
  id = "horario-semana",
  label = "Horario del punto (opcional)",
  value,
  onChange,
  className,
}: Props) {
  const selected = parseHorarioSemana(value)

  function commit(next: Set<string>) {
    onChange(serializeHorarioSemana(next))
  }

  function toggleCell(dia: DiaKey, franja: FranjaKey) {
    const key = cellKey(dia, franja)
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    commit(next)
  }

  function toggleDia(dia: DiaKey) {
    const keys = FRANJAS.map((f) => cellKey(dia, f.key))
    const allOn = keys.every((k) => selected.has(k))
    const next = new Set(selected)
    for (const k of keys) {
      if (allOn) next.delete(k)
      else next.add(k)
    }
    commit(next)
  }

  function diaState(dia: DiaKey): "all" | "some" | "none" {
    const keys = FRANJAS.map((f) => cellKey(dia, f.key))
    const n = keys.filter((k) => selected.has(k)).length
    if (n === 0) return "none"
    if (n === keys.length) return "all"
    return "some"
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <Label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </Label>
      ) : null}

      <div
        id={id}
        className="overflow-x-auto rounded-lg border border-border"
        role="group"
        aria-label={label || "Horario del punto de recolección"}
      >
        <table className="w-full min-w-[320px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th
                scope="col"
                className="px-3 py-2 text-left font-medium text-foreground"
              >
                Día
              </th>
              {FRANJAS.map((f) => (
                <th
                  key={f.key}
                  scope="col"
                  className="px-2 py-2 text-center font-medium text-foreground"
                >
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DIAS.map((dia) => {
              const state = diaState(dia.key)
              return (
                <tr
                  key={dia.key}
                  className="border-b border-border last:border-b-0"
                >
                  <th scope="row" className="px-3 py-2 text-left font-normal">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={state === "all"}
                        ref={(el) => {
                          if (el) el.indeterminate = state === "some"
                        }}
                        onChange={() => toggleDia(dia.key)}
                        className="h-4 w-4 accent-primary"
                        aria-label={`Todo el ${dia.label}`}
                      />
                      <span className="text-foreground">{dia.label}</span>
                    </label>
                  </th>
                  {FRANJAS.map((f) => {
                    const key = cellKey(dia.key, f.key)
                    const on = selected.has(key)
                    return (
                      <td key={f.key} className="px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggleCell(dia.key, f.key)}
                          className="h-4 w-4 accent-primary"
                          aria-label={`${dia.label} ${f.label}`}
                        />
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {value.trim() ? (
        <p className="text-xs text-muted-foreground">{value}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Marca cuándo reciben en este punto de recolección.
        </p>
      )}
    </div>
  )
}
