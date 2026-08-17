"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { DashboardShell, StatTile } from "@/components/layout/dashboard-shell"
import { Button } from "@/components/ui/button"
import { ItemProgressRow } from "@/components/iniciativa/item-progress-row"
import { StatusBadge } from "@/components/iniciativa/status-badges"
import { useRequireRoleTree } from "@/hooks/use-require-role-tree"
import { ApiError } from "@/lib/api"
import {
  enviarRevision,
  fetchAportantes,
  fetchMisIniciativas,
  marcarAporteRecepcion,
} from "@/lib/convites-api"
import { progresoTotal, type Iniciativa } from "@/lib/data"
import type { ApiAporte } from "@/lib/types"
import {
  Check,
  Megaphone,
  Plus,
  ArrowUpRight,
  Users,
  Camera,
} from "lucide-react"

export function PanelCreadorClient() {
  const { token, loading: authLoading, hasPermission } = useRequireRoleTree(
    "/panel/creador",
    "aportante",
  )
  const [mias, setMias] = useState<Iniciativa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [aportantesByIni, setAportantesByIni] = useState<Record<string, ApiAporte[]>>({})
  const [loadingAportantes, setLoadingAportantes] = useState<string | null>(null)
  const [recepcionId, setRecepcionId] = useState<number | null>(null)

  useEffect(() => {
    if (authLoading || !token) return

    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchMisIniciativas(token!)
        if (!cancelled) setMias(data)
      } catch {
        if (!cancelled) {
          setMias([])
          setError("No pudimos cargar tus convites.")
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

  async function onEnviarRevision(ini: Iniciativa) {
    if (!token || sendingId) return
    setSendingId(ini.id)
    setError(null)
    try {
      const updated = await enviarRevision(token, ini.id)
      setMias((prev) =>
        prev.map((i) => (i.id === ini.id ? { ...i, ...updated } : i)),
      )
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos enviar a revisión."
          : "No pudimos enviar a revisión.",
      )
    } finally {
      setSendingId(null)
    }
  }

  async function loadAportantes(ini: Iniciativa) {
    if (!token || loadingAportantes) return
    if (aportantesByIni[ini.id]) return
    setLoadingAportantes(ini.id)
    try {
      const rows = await fetchAportantes(token, ini.id)
      setAportantesByIni((prev) => ({ ...prev, [ini.id]: rows }))
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos cargar aportantes."
          : "No pudimos cargar aportantes.",
      )
    } finally {
      setLoadingAportantes(null)
    }
  }

  async function onMarcarRecepcion(
    ini: Iniciativa,
    aporte: ApiAporte,
    recibido: boolean,
    evidencia?: File | null,
  ) {
    if (!token || recepcionId) return
    setRecepcionId(aporte.id)
    setError(null)
    try {
      const res = await marcarAporteRecepcion(token, aporte.id, {
        recibido,
        evidencia: evidencia ?? null,
      })
      setAportantesByIni((prev) => ({
        ...prev,
        [ini.id]: (prev[ini.id] ?? []).map((a) =>
          a.id === aporte.id ? res.data : a,
        ),
      }))
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos actualizar el aporte."
          : "No pudimos actualizar el aporte.",
      )
    } finally {
      setRecepcionId(null)
    }
  }

  const abiertos = useMemo(
    () =>
      mias.filter((i) =>
        ["publicada", "en-curso", "en-revision", "borrador", "rechazada"].includes(
          i.estado,
        ),
      ),
    [mias],
  )

  const avancePromedio = useMemo(() => {
    if (mias.length === 0) return 0
    const suma = mias.reduce(
      (a, i) => a + (i.progreso ?? progresoTotal(i.items)),
      0,
    )
    return Math.round(suma / mias.length)
  }, [mias])

  const totalAsistentes = useMemo(
    () => mias.reduce((acc, i) => acc + (i.asistentes || 0), 0),
    [mias],
  )

  const tabs = [
    { href: "/panel/aportante", label: "Aportante" },
    { href: "/panel/creador", label: "Organizador", active: true },
    ...(hasPermission("iniciativas.moderate")
      ? [{ href: "/moderacion", label: "Moderación" }]
      : []),
  ]

  if (authLoading || (!token && loading)) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-muted-foreground">
        Cargando tus convites…
      </div>
    )
  }

  if (!token) return null

  return (
    <DashboardShell
      title="Tus convites"
      subtitle="Haz seguimiento a lo que la comunidad ya reservó y a lo que todavía falta por conseguir."
      tabs={tabs}
    >
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Convites abiertos"
          value={String(abiertos.length)}
          hint="Recibiendo aportes"
          icon={<Megaphone className="h-5 w-5" />}
        />
        <StatTile
          label="Personas que aportan"
          value={String(totalAsistentes)}
          hint="Asistentes registrados"
          icon={<Users className="h-5 w-5" />}
        />
        <StatTile
          label="Avance promedio"
          value={`${avancePromedio}%`}
          hint="De lo necesitado"
        />
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif text-2xl text-foreground">En curso</h2>
        <Button render={<Link href="/crear" />} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo convite
        </Button>
      </div>

      {error ? (
        <p className="mb-4 text-sm text-destructive">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : mias.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="font-medium text-foreground">Aún no has abierto un convite</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cuéntanos qué necesita tu comunidad y envíalo a revisión.
          </p>
          <Button className="mt-4" render={<Link href="/crear" />}>
            Abrir un convite
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {mias.map((ini) => {
            const puedeVerAportantes = ["publicada", "en-curso", "cerrada"].includes(
              ini.estado,
            )
            const aportantes = aportantesByIni[ini.id]

            return (
              <article
                key={ini.slug}
                className="rounded-xl border border-border bg-card p-5 md:p-6"
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2">
                      <StatusBadge estado={ini.estado} />
                    </div>
                    <h3 className="text-balance font-serif text-xl text-foreground">
                      {ini.titulo}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ini.zona} · {ini.progreso ?? progresoTotal(ini.items)}% de avance
                      {ini.asistentes > 0
                        ? ` · ${ini.asistentes} personas aportando`
                        : ""}
                    </p>
                    {ini.estado === "rechazada" && ini.notaModeracion ? (
                      <p className="mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        Moderación: {ini.notaModeracion}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {(ini.estado === "borrador" || ini.estado === "rechazada") && (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={sendingId === ini.id || ini.items.length === 0}
                        onClick={() => void onEnviarRevision(ini)}
                      >
                        {sendingId === ini.id
                          ? "Enviando…"
                          : "Enviar a revisión"}
                      </Button>
                    )}
                    {puedeVerAportantes || hasPermission("iniciativas.moderate") ? (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={loadingAportantes === ini.id}
                        onClick={() => void loadAportantes(ini)}
                      >
                        {loadingAportantes === ini.id
                          ? "Cargando…"
                          : aportantes
                            ? `Aportantes (${aportantes.length})`
                            : "Ver aportantes"}
                      </Button>
                    ) : null}
                    <Link
                      href={`/iniciativa/${ini.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      Ver público <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                <div className="space-y-4">
                  {ini.items.map((item) => (
                    <ItemProgressRow key={item.id} item={item} />
                  ))}
                  {ini.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Sin ítems registrados.
                    </p>
                  ) : null}
                </div>

                {aportantes ? (
                  <div className="mt-6 border-t border-border pt-5">
                    <h4 className="mb-3 text-sm font-semibold text-foreground">
                      Aportantes
                    </h4>
                    {aportantes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Todavía no hay aportes confirmados.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {aportantes.map((aporte) => (
                          <AportanteRow
                            key={aporte.id}
                            aporte={aporte}
                            busy={recepcionId === aporte.id}
                            onRecibido={(file) =>
                              void onMarcarRecepcion(ini, aporte, true, file)
                            }
                            onNoRecibido={() =>
                              void onMarcarRecepcion(ini, aporte, false)
                            }
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </DashboardShell>
  )
}

function AportanteRow({
  aporte,
  busy,
  onRecibido,
  onNoRecibido,
}: {
  aporte: ApiAporte
  busy: boolean
  onRecibido: (file?: File | null) => void
  onNoRecibido: () => void
}) {
  const recibido = aporte.estado === "cumplido"
  const itemsLabel = aporte.items
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
                </a>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
