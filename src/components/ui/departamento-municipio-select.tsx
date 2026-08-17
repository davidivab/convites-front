"use client"

import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchDepartamentos, fetchMunicipios } from "@/lib/convites-api"
import type { ApiDepartamento, ApiMunicipio } from "@/lib/types"
import { cn } from "@/lib/utils"

type Props = {
  municipioId: string
  onMunicipioChange: (municipioId: string, municipioNombre?: string) => void
  required?: boolean
  optional?: boolean
  className?: string
  departamentoLabel?: string
  municipioLabel?: string
  /** P33: puntos de acopio pueden usar municipios fuera del catálogo “activo” */
  incluirInactivos?: boolean
}

/**
 * Selector en cascada: departamento → municipios de ese departamento.
 */
export function DepartamentoMunicipioSelect({
  municipioId,
  onMunicipioChange,
  required = false,
  optional = false,
  className,
  departamentoLabel = "Departamento",
  municipioLabel = "Municipio",
  incluirInactivos = false,
}: Props) {
  const [departamentos, setDepartamentos] = useState<ApiDepartamento[]>([])
  const [municipios, setMunicipios] = useState<ApiMunicipio[]>([])
  const [departamentoId, setDepartamentoId] = useState("")
  const [loadingDepts, setLoadingDepts] = useState(true)
  const [loadingMun, setLoadingMun] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoadingDepts(true)
      try {
        const data = await fetchDepartamentos(false, { incluirInactivos })
        if (!cancelled) setDepartamentos(data)
      } catch {
        if (!cancelled) setDepartamentos([])
      } finally {
        if (!cancelled) setLoadingDepts(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [incluirInactivos])

  useEffect(() => {
    if (!departamentoId) {
      setMunicipios([])
      return
    }
    let cancelled = false
    async function load() {
      setLoadingMun(true)
      try {
        const data = await fetchMunicipios(Number(departamentoId), false, {
          incluirInactivos,
        })
        if (!cancelled) setMunicipios(data)
      } catch {
        if (!cancelled) setMunicipios([])
      } finally {
        if (!cancelled) setLoadingMun(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [departamentoId, incluirInactivos])

  function onDepartamentoChange(value: string | null) {
    const next = value ?? ""
    setDepartamentoId(next)
    onMunicipioChange("", undefined)
  }

  function onMunicipioSelect(value: string | null) {
    const next = value ?? ""
    const nombre = municipios.find((m) => String(m.id) === next)?.nombre
    onMunicipioChange(next, nombre)
  }

  return (
    <div className={cn("grid gap-5 sm:grid-cols-2", className)}>
      <div className="space-y-2">
        <Label htmlFor="departamento">
          {departamentoLabel}
          {required && !optional ? (
            <span className="text-primary"> *</span>
          ) : optional ? (
            <span className="font-normal text-muted-foreground"> (opcional)</span>
          ) : null}
        </Label>
        <Select
          value={departamentoId || undefined}
          onValueChange={onDepartamentoChange}
          disabled={loadingDepts}
          items={departamentos.map((d) => ({
            value: String(d.id),
            label: d.nombre,
          }))}
        >
          <SelectTrigger id="departamento">
            <SelectValue
              placeholder={
                loadingDepts ? "Cargando…" : "Elige un departamento"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {departamentos.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="municipio">
          {municipioLabel}
          {required && !optional ? (
            <span className="text-primary"> *</span>
          ) : optional ? (
            <span className="font-normal text-muted-foreground"> (opcional)</span>
          ) : null}
        </Label>
        <Select
          value={municipioId || undefined}
          onValueChange={onMunicipioSelect}
          disabled={!departamentoId || loadingMun}
          items={municipios.map((m) => ({
            value: String(m.id),
            label: m.nombre,
          }))}
        >
          <SelectTrigger id="municipio">
            <SelectValue
              placeholder={
                !departamentoId
                  ? "Primero elige departamento"
                  : loadingMun
                    ? "Cargando…"
                    : "Elige un municipio"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {municipios.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>
                {m.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
