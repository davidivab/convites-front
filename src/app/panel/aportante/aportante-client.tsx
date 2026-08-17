"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { DashboardShell, StatTile } from "@/components/layout/dashboard-shell"
import { Button } from "@/components/ui/button"
import { useRequireRoleTree } from "@/hooks/use-require-role-tree"
import { ApiError } from "@/lib/api"
import { cancelarAporte, fetchMisAportes } from "@/lib/convites-api"
import type { ApiAporte } from "@/lib/types"
import { CalendarClock, HandHeart, Sprout, CheckCircle2, MapPin } from "lucide-react"

function formatAporteItems(aporte: ApiAporte): string {
  if (!aporte.items?.length) {
    return aporte.asiste_al_convite ? "Asistencia al convite" : "Sin ítems"
  }
  return aporte.items
    .map((it) => {
      const nombre = it.nombre || "Ítem"
      const unidad = it.unidad ? ` ${it.unidad}` : ""
      return `${it.cantidad}${unidad} ${nombre}`
    })
    .join(", ")
}

function formatFecha(value: string | null | undefined): string {
  if (!value) return "Por definir"
  try {
    return new Date(value).toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return value
  }
}

export function PanelAportanteClient() {
  const { user, token, loading: authLoading, hasPermission } = useRequireRoleTree(
    "/panel/aportante",
    "aportante",
  )
  const [aportes, setAportes] = useState<ApiAporte[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  useEffect(() => {
    if (authLoading || !token) return

    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchMisAportes(token!)
        if (!cancelled) setAportes(data)
      } catch {
        if (!cancelled) {
          setAportes([])
          setError("No pudimos cargar tus aportes.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [authLoading, token])

  async function onCancelar(aporteId: number) {
    if (!token || cancellingId) return
    const ok = window.confirm(
      "¿Cancelar este compromiso? Se restará de los contadores del convite.",
    )
    if (!ok) return
    setCancellingId(aporteId)
    setError(null)
    try {
      await cancelarAporte(token, aporteId)
      setAportes((prev) =>
        prev.map((a) =>
          a.id === aporteId
            ? { ...a, estado: "cancelado", estado_label: "Cancelado" }
            : a,
        ),
      )
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos cancelar el aporte."
          : "No pudimos cancelar el aporte.",
      )
    } finally {
      setCancellingId(null)
    }
  }

  const activos = useMemo(
    () =>
      aportes.filter(
        (a) => a.estado !== "cancelado" && a.estado !== "cumplido",
      ),
    [aportes],
  )
  const historial = useMemo(
    () =>
      aportes.filter(
        (a) => a.estado === "cancelado" || a.estado === "cumplido",
      ),
    [aportes],
  )

  const proximo = activos
    .map((a) => a.iniciativa?.fecha_convite)
    .filter(Boolean)
    .sort()[0]

  const tabs = [
    { href: "/panel/aportante", label: "Aportante", active: true },
    { href: "/panel/creador", label: "Organizador" },
    ...(hasPermission("iniciativas.moderate")
      ? [{ href: "/moderacion", label: "Moderación" }]
      : []),
  ]

  if (authLoading || (!token && loading)) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-muted-foreground">
        Cargando tu panel…
      </div>
    )
  }

  if (!token) return null

  return (
    <DashboardShell
      title={`Hola, ${user?.name?.split(" ")[0] || "vecino"}`}
      subtitle="Este es el resumen de los convites a los que te has sumado. Gracias por poner el hombro."
      tabs={tabs}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Aportes activos"
          value={String(activos.length)}
          hint="Convites en curso"
          icon={<HandHeart className="h-5 w-5" />}
        />
        <StatTile
          label="Convites apoyados"
          value={String(aportes.length)}
          hint="En total"
          icon={<Sprout className="h-5 w-5" />}
        />
        <StatTile
          label="Próximo convite"
          value={proximo ? formatFecha(proximo) : "—"}
          hint={activos[0]?.iniciativa?.titulo || "Sin fecha próxima"}
          icon={<CalendarClock className="h-5 w-5" />}
        />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 font-serif text-2xl text-foreground">
          Mis compromisos
        </h2>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">Cargando compromisos…</p>
        ) : activos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
            <p className="font-medium text-foreground">Aún no tienes compromisos activos</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Explora los convites abiertos y suma tu aporte.
            </p>
            <Button className="mt-4" render={<Link href="/explorar" />}>
              Explorar convites
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {activos.map((c) => (
              <div
                key={c.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {c.estado_label || c.estado}
                  </div>
                  <h3 className="text-pretty font-medium text-foreground">
                    {c.iniciativa?.titulo || "Convite"}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatAporteItems(c)}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {formatFecha(c.iniciativa?.fecha_convite)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {c.iniciativa?.slug ? (
                    <Button
                      variant="outline"
                      render={<Link href={`/iniciativa/${c.iniciativa.slug}`} />}
                    >
                      Ver convite
                    </Button>
                  ) : null}
                  {c.estado === "confirmado" ? (
                    <Button
                      variant="ghost"
                      type="button"
                      disabled={cancellingId === c.id}
                      onClick={() => void onCancelar(c.id)}
                    >
                      {cancellingId === c.id ? "Cancelando…" : "Cancelar aporte"}
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-serif text-2xl text-foreground">
          Historial
        </h2>
        {historial.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Cuando completes o canceles un aporte, aparecerá aquí.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {historial.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-foreground">
                    {h.iniciativa?.titulo || "Convite"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatAporteItems(h)}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {h.iniciativa?.lugar_convite || formatFecha(h.confirmado_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </DashboardShell>
  )
}
