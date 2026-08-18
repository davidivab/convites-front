"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { useRequireRoleTree } from "@/hooks/use-require-role-tree"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ApiError } from "@/lib/api"
import {
  fetchModeracionIniciativas,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  moderarIniciativa,
  type ApiNotification,
} from "@/lib/convites-api"
import type { Iniciativa } from "@/lib/data"
import { perfilTabsForRole } from "@/lib/role-tree"
import { Bell, Check, X, MapPin, Clock, Package, ShieldCheck, MessageSquare } from "lucide-react"

type DecisionLocal = "aprobada" | "rechazada" | "cambios" | null

export function ModeracionClient({
  basePath = "/moderacion",
  /** Prefijo de edición: /moderacion/convites → …/slug/editar; /admin/convites → …/slug */
  editPathPrefix = "/moderacion/convites",
  editWithSuffix = true,
  allowedRoles = ["admin", "moderador"] as const,
}: {
  basePath?: string
  editPathPrefix?: string
  /** Si false, el enlace es `${editPathPrefix}/${slug}` (admin). */
  editWithSuffix?: boolean
  allowedRoles?: readonly ("admin" | "moderador")[]
}) {
  const { user, token, loading: authLoading, hasPermission } = useRequireRoleTree(
    basePath,
    [...allowedRoles],
  )

  function editHref(slug: string) {
    return editWithSuffix
      ? `${editPathPrefix}/${slug}/editar`
      : `${editPathPrefix}/${slug}`
  }
  const [cola, setCola] = useState<Iniciativa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [decisiones, setDecisiones] = useState<Record<string, DecisionLocal>>({})
  const [actingId, setActingId] = useState<string | null>(null)
  const [nota, setNota] = useState<Record<string, string>>({})
  const [notifs, setNotifs] = useState<ApiNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifBusy, setNotifBusy] = useState(false)

  const canModerate = hasPermission("iniciativas.moderate")

  const loadNotifs = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetchNotifications(token, { per_page: 15 })
      setNotifs(res.data)
      setUnreadCount(res.unread_count)
    } catch {
      setNotifs([])
      setUnreadCount(0)
    }
  }, [token])

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchModeracionIniciativas(token)
      setCola(data)
    } catch (err) {
      setCola([])
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos cargar la cola de moderación."
          : "No pudimos cargar la cola de moderación.",
      )
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (authLoading || !token) return
    if (!canModerate) {
      setLoading(false)
      return
    }
    void load()
    void loadNotifs()
  }, [authLoading, token, canModerate, load, loadNotifs])

  async function onMarkRead(id: string) {
    if (!token || notifBusy) return
    setNotifBusy(true)
    try {
      await markNotificationRead(token, id)
      await loadNotifs()
    } catch {
      // ignore — inbox is best-effort
    } finally {
      setNotifBusy(false)
    }
  }

  async function onMarkAllRead() {
    if (!token || notifBusy || unreadCount === 0) return
    setNotifBusy(true)
    try {
      await markAllNotificationsRead(token)
      await loadNotifs()
    } catch {
      // ignore
    } finally {
      setNotifBusy(false)
    }
  }

  async function actuar(
    id: string,
    accion: "aprobar" | "rechazar" | "solicitar-cambios",
  ) {
    if (!token || actingId) return
    const body: Record<string, unknown> = {}
    if (accion !== "aprobar") {
      const texto = (nota[id] || "").trim()
      if (!texto) {
        setError("Escribe una nota para rechazar o solicitar cambios.")
        return
      }
      body.nota = texto
    } else if ((nota[id] || "").trim()) {
      body.nota = nota[id].trim()
    }

    setActingId(id)
    setError(null)
    try {
      await moderarIniciativa(token, id, accion, body)
      setDecisiones((d) => ({
        ...d,
        [id]:
          accion === "aprobar"
            ? "aprobada"
            : accion === "rechazar"
              ? "rechazada"
              : "cambios",
      }))
      setCola((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos aplicar la decisión."
          : "No pudimos aplicar la decisión.",
      )
    } finally {
      setActingId(null)
    }
  }

  if (authLoading) {
    return (
      <p className="mx-auto max-w-6xl px-4 py-16 text-sm text-muted-foreground">
        Comprobando permisos…
      </p>
    )
  }

  if (!token) return null

  if (!canModerate) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-medium text-foreground">
          No tienes permiso de moderación
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta cola solo está disponible para el equipo moderador.
        </p>
        <Button className="mt-4" render={<Link href="/" />}>
          Volver al inicio
        </Button>
      </div>
    )
  }

  const pendientes = cola.filter((i) => !decisiones[i.id]).length
  const tabs = perfilTabsForRole(user, basePath)

  return (
    <DashboardShell
      title="Cola de moderación"
      subtitle="Revisamos cada convite antes de publicarlo. Verificamos que sea real, que la comunidad lo respalde y que no pida dinero por fuera de las reglas."
      tabs={tabs}
    >
    <div>
      <section className="mb-8 rounded-xl border border-border bg-card/60 p-4 md:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-serif text-lg text-foreground">
            <Bell className="h-4 w-4" />
            Avisos
            {unreadCount > 0 ? (
              <Badge className="bg-accent/15 text-accent-foreground">
                {unreadCount} sin leer
              </Badge>
            ) : null}
          </h2>
          {unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={notifBusy}
              onClick={() => void onMarkAllRead()}
            >
              Marcar todas leídas
            </Button>
          ) : null}
        </div>
        {notifs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin avisos todavía. Cuando un convite entre a revisión o haya un
            aporte nuevo en tus municipios, aparecerá aquí.
          </p>
        ) : (
          <ul className="space-y-2">
            {notifs.map((n) => {
              const mensaje =
                (typeof n.data?.mensaje === "string" && n.data.mensaje) ||
                n.type
              const slug =
                typeof n.data?.slug === "string" ? n.data.slug : null
              const unread = !n.read_at
              return (
                <li
                  key={n.id}
                  className={`flex flex-wrap items-start justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
                    unread
                      ? "border-border bg-background"
                      : "border-transparent text-muted-foreground"
                  }`}
                >
                  <div className="min-w-0">
                    <p className={unread ? "font-medium text-foreground" : ""}>
                      {mensaje}
                    </p>
                    {n.created_at ? (
                      <p className="text-xs text-muted-foreground">
                        {new Date(n.created_at).toLocaleString("es-CO")}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {slug ? (
                      <Button
                        variant="outline"
                        size="sm"
                        render={<Link href={`/iniciativa/${slug}`} />}
                      >
                        Ver
                      </Button>
                    ) : null}
                    {unread ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={notifBusy}
                        onClick={() => void onMarkRead(n.id)}
                      >
                        Leída
                      </Button>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge className="gap-1.5 bg-accent/15 text-accent-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          {pendientes} por revisar
        </Badge>
        <p className="text-sm text-muted-foreground">
          Solo ves convites de tus municipios asignados. Las decisiones se
          guardan en el servidor.
        </p>
      </div>

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando cola…</p>
      ) : cola.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="font-medium text-foreground">No hay convites pendientes</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cuando alguien envíe uno a revisión, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {cola.map((item) => {
            const decision = decisiones[item.id] ?? null
            return (
              <article
                key={item.id}
                className="rounded-xl border border-border bg-card p-5 md:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-balance font-serif text-xl text-foreground">
                      {item.titulo}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" /> {item.zona}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-4 w-4" /> {item.fechaConvite}
                      </span>
                    </div>
                    <p className="mt-3 text-pretty leading-relaxed text-foreground/80">
                      {item.resumen}
                    </p>
                    <p className="mt-3 text-sm font-medium text-foreground">
                      Propone: {item.creador}
                    </p>
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        render={<Link href={editHref(item.slug)} />}
                      >
                        Editar convite / aportes
                      </Button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.items.map((it) => (
                        <span
                          key={it.id}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-secondary-foreground"
                        >
                          <Package className="h-3.5 w-3.5" />
                          {it.meta} {it.unidad} {it.nombre}
                        </span>
                      ))}
                    </div>

                    {!decision ? (
                      <div className="mt-4 space-y-2">
                        <label className="block text-sm font-medium text-foreground">
                          Nota (obligatoria al rechazar o pedir cambios)
                        </label>
                        <textarea
                          value={nota[item.id] || ""}
                          onChange={(e) =>
                            setNota((n) => ({ ...n, [item.id]: e.target.value }))
                          }
                          rows={2}
                          placeholder="Comentario para quien organiza…"
                          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto">
                    {!decision ? (
                      <>
                        <Button
                          className="gap-2"
                          disabled={actingId === item.id}
                          onClick={() => void actuar(item.id, "aprobar")}
                        >
                          <Check className="h-4 w-4" /> Aprobar
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2"
                          disabled={actingId === item.id}
                          onClick={() =>
                            void actuar(item.id, "solicitar-cambios")
                          }
                        >
                          <MessageSquare className="h-4 w-4" /> Pedir cambios
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2"
                          disabled={actingId === item.id}
                          onClick={() => void actuar(item.id, "rechazar")}
                        >
                          <X className="h-4 w-4" /> Rechazar
                        </Button>
                      </>
                    ) : (
                      <Badge
                        className={
                          decision === "aprobada"
                            ? "gap-1.5 bg-accent/15 text-accent-foreground"
                            : decision === "cambios"
                              ? "gap-1.5 bg-warning/15 text-warning-foreground"
                              : "gap-1.5 bg-destructive/10 text-destructive"
                        }
                      >
                        {decision === "aprobada"
                          ? "Aprobada"
                          : decision === "cambios"
                            ? "Cambios solicitados"
                            : "Rechazada"}
                      </Badge>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
    </DashboardShell>
  )
}
