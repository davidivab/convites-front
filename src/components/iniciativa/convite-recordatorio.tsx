"use client"

import { useEffect, useState } from "react"
import { CalendarPlus, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import { fetchMisAportes } from "@/lib/convites-api"
import {
  buildConviteIcs,
  downloadIcs,
  googleCalendarUrl,
} from "@/lib/calendar-ics"

type LineaAporte = {
  cantidad: number
  nombre: string
  unidad: string | null
}

/**
 * Destaca fecha/lugar del convite bajo el título; si el viewer ya aportó,
 * lista su compromiso y ofrece guardar el evento en el calendario.
 */
export function ConviteRecordatorio({
  iniciativaId,
  slug,
  titulo,
  fechaTexto,
  fechaISO,
  lugar,
  ciudad,
}: {
  iniciativaId: number
  slug: string
  titulo: string
  fechaTexto: string
  fechaISO?: string | null
  lugar: string
  ciudad: string
}) {
  const { token } = useAuth()
  const [lineas, setLineas] = useState<LineaAporte[] | null>(null)
  const [asiste, setAsiste] = useState(false)
  const [tieneAporte, setTieneAporte] = useState(false)
  const [lugarAporte, setLugarAporte] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setLineas(null)
      setAsiste(false)
      setTieneAporte(false)
      setLugarAporte(null)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const aportes = await fetchMisAportes(token)
        if (cancelled) return
        const mio = aportes.find(
          (a) =>
            a.iniciativa?.id === iniciativaId && a.estado !== "cancelado",
        )
        if (!mio) {
          setTieneAporte(false)
          setLineas(null)
          setAsiste(false)
          setLugarAporte(null)
          return
        }
        setTieneAporte(true)
        setAsiste(Boolean(mio.asiste_al_convite))
        setLugarAporte(
          mio.iniciativa?.lugar_exacto ||
            mio.iniciativa?.lugar_convite ||
            null,
        )
        setLineas(
          (mio.items ?? []).map((it) => ({
            cantidad: it.cantidad,
            nombre: it.nombre ?? "Ítem",
            unidad: it.unidad ?? null,
          })),
        )
      } catch {
        if (!cancelled) {
          setTieneAporte(false)
          setLineas(null)
          setAsiste(false)
          setLugarAporte(null)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, iniciativaId])

  const direccion = lugarAporte || lugar

  const pageUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/iniciativa/${slug}`
      : `/iniciativa/${slug}`

  const calendarInput =
    fechaISO
      ? {
          titulo: `Convite: ${titulo}`,
          fechaISO,
          lugar: direccion,
          ciudad,
          descripcion: [
            `Nos vemos en el convite el ${fechaTexto}.`,
            `Lugar: ${direccion}, ${ciudad}.`,
            tieneAporte && lineas && lineas.length > 0
              ? `Lleva: ${lineas
                  .map(
                    (l) =>
                      `${l.cantidad}${l.unidad ? ` ${l.unidad}` : ""} ${l.nombre}`,
                  )
                  .join("; ")}.`
              : null,
            asiste ? "Confirmaste asistencia / apoyo con tu tiempo." : null,
            pageUrl,
          ]
            .filter(Boolean)
            .join(" "),
          url: pageUrl,
          uid: `convite-${slug}@convites.co`,
        }
      : null

  const gcal = calendarInput ? googleCalendarUrl(calendarInput) : null

  function guardarCalendario() {
    if (!calendarInput) return
    const ics = buildConviteIcs(calendarInput)
    if (!ics) return
    downloadIcs(`${slug}.ics`, ics)
  }

  const materialesHint =
    tieneAporte && lineas && lineas.length > 0
      ? " y no olvides traer tus materiales"
      : tieneAporte && asiste
        ? " — el organizador cuenta con tu tiempo"
        : " y no olvides traer tus materiales"

  return (
    <aside
      className="mt-5 rounded-2xl border border-accent/30 bg-accent/8 px-4 py-4 sm:px-5 sm:py-5"
      aria-label="Fecha del convite"
    >
      <p className="text-sm leading-relaxed text-foreground sm:text-base">
        Nos vemos en el convite el{" "}
        <span className="font-semibold">{fechaTexto}</span>. Anota para llegar a
        la dirección{" "}
        <span className="font-semibold">{direccion}</span> en{" "}
        <span className="font-semibold">{ciudad}</span>
        {materialesHint}.
      </p>

      {tieneAporte &&
      ((lineas && lineas.length > 0) || asiste) ? (
        <div className="mt-3 rounded-xl border border-border bg-card/80 px-3 py-3">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Package className="size-3.5" />
            Tu compromiso
          </p>
          <ul className="mt-2 space-y-1 text-sm text-foreground">
            {lineas?.map((l, i) => (
              <li key={`${l.nombre}-${i}`}>
                {l.cantidad}
                {l.unidad ? ` ${l.unidad}` : ""} {l.nombre}
              </li>
            ))}
            {asiste ? (
              <li>Asistencia / apoyo con tu tiempo el día del convite</li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {calendarInput ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            onClick={guardarCalendario}
          >
            <CalendarPlus className="size-4" />
            Guardar en el calendario
          </Button>
          {gcal ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              nativeButton={false}
              render={
                <a href={gcal} target="_blank" rel="noopener noreferrer" />
              }
            >
              Abrir en Google Calendar
            </Button>
          ) : null}
        </div>
      ) : null}
    </aside>
  )
}
