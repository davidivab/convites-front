"use client"

import { useCallback, useEffect, useState } from "react"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRequireRoleTree } from "@/hooks/use-require-role-tree"
import { ApiError } from "@/lib/api"
import {
  aprobarSolicitudRol,
  fetchAdminSolicitudesRol,
  rechazarSolicitudRol,
  type ApiSolicitudRol,
} from "@/lib/convites-api"
import { perfilTabsForRole } from "@/lib/role-tree"

export function AdminSolicitudesRolClient() {
  const { user, token, loading: authLoading, hasPermission } = useRequireRoleTree(
    "/admin/solicitudes-rol",
    "admin",
  )
  const canManage = hasPermission("users.manage")

  const [items, setItems] = useState<ApiSolicitudRol[]>([])
  const [loading, setLoading] = useState(true)
  const [apiReady, setApiReady] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rechazoId, setRechazoId] = useState<number | null>(null)
  const [nota, setNota] = useState("")
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminSolicitudesRol(token, { estado: "pendiente" })
      setItems(data)
      setApiReady(true)
    } catch (err) {
      setItems([])
      if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
        setApiReady(false)
      } else {
        setError(
          err instanceof ApiError
            ? err.body.message || "No pudimos cargar solicitudes."
            : "No pudimos cargar solicitudes.",
        )
      }
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (authLoading || !token || !canManage) {
      setLoading(false)
      return
    }
    void load()
  }, [authLoading, token, canManage, load])

  async function onAprobar(id: number) {
    if (!token || busyId) return
    setBusyId(id)
    setError(null)
    try {
      await aprobarSolicitudRol(token, id)
      await load()
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos aprobar."
          : "No pudimos aprobar.",
      )
    } finally {
      setBusyId(null)
    }
  }

  async function onRechazar(id: number) {
    if (!token || busyId || !nota.trim()) return
    setBusyId(id)
    setError(null)
    try {
      await rechazarSolicitudRol(token, id, nota.trim())
      setRechazoId(null)
      setNota("")
      await load()
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos rechazar."
          : "No pudimos rechazar.",
      )
    } finally {
      setBusyId(null)
    }
  }

  if (authLoading || (!token && loading)) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-muted-foreground">
        Cargando…
      </div>
    )
  }
  if (!token) return null
  if (!canManage) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-serif text-2xl text-foreground">Sin acceso</h1>
      </div>
    )
  }

  return (
    <DashboardShell
      title="Solicitudes de rol"
      subtitle="Aprueba o rechaza pedidos de ciudadanos para ser moderador o voluntario. El profesional se modera en su propio flujo de perfiles."
      tabs={perfilTabsForRole(user, "/admin/solicitudes-rol")}
    >
      {!apiReady ? (
        <p className="mb-6 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          No pudimos cargar la cola. Revisa que el API esté arriba.
        </p>
      ) : null}

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay solicitudes pendientes.
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((s) => (
            <li
              key={s.id}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">
                    {s.user?.name ?? "Ciudadano"}{" "}
                    <span className="text-muted-foreground">
                      ({s.user?.email ?? "—"})
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    Rol: <strong>{s.rol}</strong>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Municipios:{" "}
                    {s.municipios.map((m) => m.nombre).join(", ") || "—"}
                  </p>
                  {s.mensaje ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      “{s.mensaje}”
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={busyId === s.id}
                    onClick={() => void onAprobar(s.id)}
                  >
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === s.id}
                    onClick={() => {
                      setRechazoId(s.id)
                      setNota("")
                    }}
                  >
                    Rechazar
                  </Button>
                </div>
              </div>
              {rechazoId === s.id ? (
                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  <Label htmlFor={`nota-${s.id}`}>Nota de rechazo</Label>
                  <Textarea
                    id={`nota-${s.id}`}
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    rows={2}
                    required
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={!nota.trim() || busyId === s.id}
                      onClick={() => void onRechazar(s.id)}
                    >
                      Confirmar rechazo
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setRechazoId(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  )
}
