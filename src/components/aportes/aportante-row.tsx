"use client"

import { useState } from "react"
import { Camera, Check, MapPin, Trash2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ApiAporte } from "@/lib/types"

export function AportanteRow({
  aporte,
  busy,
  onRecibido,
  onNoRecibido,
  onEliminarEvidencia,
  onAnular,
}: {
  aporte: ApiAporte
  busy: boolean
  onRecibido: (file?: File | null) => void
  onNoRecibido: () => void
  onEliminarEvidencia?: () => void
  /** Organizador/admin: anula el aporte (sale del %). Motivo opcional. */
  onAnular?: (motivo: string | null) => void
}) {
  const [anularAbierto, setAnularAbierto] = useState(false)
  const [motivo, setMotivo] = useState("")

  const cancelado = aporte.estado === "cancelado"
  const recibido = aporte.estado === "cumplido"
  const itemsLabel = (aporte.items ?? [])
    .map((i) => `${i.cantidad} ${i.unidad ?? ""} ${i.nombre ?? ""}`.trim())
    .join(", ")

  function confirmarAnular() {
    onAnular?.(motivo.trim() || null)
    setAnularAbierto(false)
    setMotivo("")
  }

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
          {!aporte.anonimo &&
          (aporte.aportante?.email || aporte.aportante?.celular) ? (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {[aporte.aportante.email, aporte.aportante.celular]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
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
          {cancelado && aporte.cancelado_motivo ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Motivo: {aporte.cancelado_motivo}
            </p>
          ) : null}
        </div>
        {!cancelado ? (
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
            {onAnular ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                className="gap-1 text-destructive hover:bg-destructive/10"
                onClick={() => setAnularAbierto((v) => !v)}
              >
                <XCircle className="h-3.5 w-3.5" />
                Anular
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {anularAbierto && onAnular && !cancelado ? (
        <div className="mt-3 space-y-2 rounded-md border border-border bg-muted/40 p-3">
          <p className="text-sm text-foreground">
            ¿Anular este aporte? Dejará de contar en el avance del convite.
          </p>
          <label className="block text-xs text-muted-foreground" htmlFor={`motivo-${aporte.id}`}>
            Motivo (opcional)
          </label>
          <textarea
            id={`motivo-${aporte.id}`}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            maxLength={500}
            rows={2}
            disabled={busy}
            placeholder="Ej. No entregó lo prometido / compromiso falso"
            className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={busy}
              onClick={confirmarAnular}
            >
              Confirmar anulación
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setAnularAbierto(false)
                setMotivo("")
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}
    </li>
  )
}
