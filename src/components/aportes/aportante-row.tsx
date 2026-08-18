"use client"

import { Camera, Check, MapPin, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ApiAporte } from "@/lib/types"

export function AportanteRow({
  aporte,
  busy,
  onRecibido,
  onNoRecibido,
  onEliminarEvidencia,
}: {
  aporte: ApiAporte
  busy: boolean
  onRecibido: (file?: File | null) => void
  onNoRecibido: () => void
  onEliminarEvidencia?: () => void
}) {
  const recibido = aporte.estado === "cumplido"
  const itemsLabel = (aporte.items ?? [])
    .map((i) => `${i.cantidad} ${i.unidad ?? ""} ${i.nombre ?? ""}`.trim())
    .join(", ")

  return (
    <li className="rounded-lg border border-border bg-background/60 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-foreground">
            {aporte.aportante?.name ?? "Aportante"}
            {aporte.anonimo ? (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                (anónimo)
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {itemsLabel || (aporte.asiste_al_convite ? "Solo asistencia" : "Sin ítems")}
            {aporte.asiste_al_convite && itemsLabel ? " · Asiste al convite" : ""}
          </p>
          {aporte.punto_acopio ? (
            <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
              Entrega en: {aporte.punto_acopio.nombre}
              {aporte.punto_acopio.municipio?.nombre
                ? ` (${aporte.punto_acopio.municipio.nombre})`
                : ""}
            </p>
          ) : null}
          {aporte.nota ? (
            <p className="mt-1 text-xs text-muted-foreground">Nota: {aporte.nota}</p>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            Estado: {aporte.estado_label ?? aporte.estado}
            {aporte.evidencia?.url ? (
              <>
                {" · "}
                <a
                  href={aporte.evidencia.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  Ver evidencia
                  {aporte.evidencia.nombre ? ` (${aporte.evidencia.nombre})` : ""}
                </a>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {aporte.evidencia?.url && onEliminarEvidencia ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              className="gap-1"
              onClick={onEliminarEvidencia}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Quitar evidencia
            </Button>
          ) : null}
          {recibido ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={onNoRecibido}
            >
              Marcar no recibido
            </Button>
          ) : (
            <>
              <label className="inline-flex cursor-pointer items-center gap-1.5">
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    onRecibido(file)
                    e.target.value = ""
                  }}
                />
                <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-muted">
                  <Camera className="h-3.5 w-3.5" />
                  Con foto
                </span>
              </label>
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={() => onRecibido(null)}
                className="gap-1"
              >
                <Check className="h-3.5 w-3.5" />
                Recibido
              </Button>
            </>
          )}
        </div>
      </div>
    </li>
  )
}
