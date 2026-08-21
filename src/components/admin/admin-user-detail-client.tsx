"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRequireRoleTree } from "@/hooks/use-require-role-tree"
import { ApiError } from "@/lib/api"
import {
  aprobarSolicitudRol,
  fetchAdminUser,
  moderarProfesional,
  rechazarSolicitudRol,
  type ApiAdminUser,
  type ApiSolicitudRol,
} from "@/lib/convites-api"
import { useAdminPerfilTabs } from "@/components/admin/use-admin-perfil-tabs"

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  moderator: "Moderador",
  voluntario: "Voluntario",
  member: "Ciudadano",
  profesional: "Profesional",
}

function StatusBadge({
  status,
}: {
  status: "active" | "pending" | "none" | undefined
}) {
  if (status === "active") {
    return (
      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
        Activo
      </span>
    )
  }
  if (status === "pending") {
    return (
      <span className="rounded-md bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
        Pendiente
      </span>
    )
  }
  return (
    <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      No aplica
    </span>
  )
}

export function AdminUserDetailClient({ userId }: { userId: number }) {
  const { user, token, loading: authLoading, hasPermission } = useRequireRoleTree(
    "/admin/usuarios",
    "admin",
  )
  const canManage = hasPermission("users.manage")
  const canModerateProf = hasPermission("profesionales.moderate")
  const tabs = useAdminPerfilTabs(user, token, "/admin/usuarios")

  const [detail, setDetail] = useState<ApiAdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [notaByKey, setNotaByKey] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      setDetail(await fetchAdminUser(token, userId))
    } catch (err) {
      setDetail(null)
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos cargar el usuario."
          : "No pudimos cargar el usuario.",
      )
    } finally {
      setLoading(false)
    }
  }, [token, userId])

  useEffect(() => {
    if (authLoading || !token || !canManage) {
      setLoading(false)
      return
    }
    void load()
  }, [authLoading, token, canManage, load])

  async function onAprobarSolicitud(s: ApiSolicitudRol) {
    if (!token || busy) return
    setBusy(`sol-${s.id}`)
    setError(null)
    try {
      await aprobarSolicitudRol(token, s.id)
      await load()
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos aprobar."
          : "No pudimos aprobar.",
      )
    } finally {
      setBusy(null)
    }
  }

  async function onRechazarSolicitud(s: ApiSolicitudRol) {
    if (!token || busy) return
    const key = `sol-${s.id}`
    const nota = (notaByKey[key] ?? "").trim()
    if (!nota) {
      setError("Escribe una nota para rechazar la solicitud.")
      return
    }
    setBusy(key)
    setError(null)
    try {
      await rechazarSolicitudRol(token, s.id, nota)
      await load()
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos rechazar."
          : "No pudimos rechazar.",
      )
    } finally {
      setBusy(null)
    }
  }

  async function onAprobarProfesional(profesionalId: number) {
    if (!token || busy) return
    setBusy(`pro-${profesionalId}`)
    setError(null)
    try {
      await moderarProfesional(token, profesionalId, "aprobar")
      await load()
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos aprobar el perfil profesional."
          : "No pudimos aprobar el perfil profesional.",
      )
    } finally {
      setBusy(null)
    }
  }

  async function onRechazarProfesional(profesionalId: number) {
    if (!token || busy) return
    const key = `pro-${profesionalId}`
    const nota = (notaByKey[key] ?? "").trim()
    if (!nota) {
      setError("Escribe una nota para rechazar el perfil profesional.")
      return
    }
    setBusy(key)
    setError(null)
    try {
      await moderarProfesional(token, profesionalId, "rechazar", { nota })
      await load()
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos rechazar el perfil profesional."
          : "No pudimos rechazar el perfil profesional.",
      )
    } finally {
      setBusy(null)
    }
  }

  if (authLoading || loading) {
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

  if (!detail) {
    return (
      <DashboardShell
        title="Usuario"
        subtitle="Detalle"
        tabs={tabs}
      >
        <p className="text-sm text-destructive">
          {error ?? "No encontramos este usuario."}
        </p>
        <Button className="mt-4" variant="outline" render={<Link href="/admin/usuarios" />}>
          Volver al listado
        </Button>
      </DashboardShell>
    )
  }

  const solicitudes = detail.solicitudes_rol ?? []
  const pro = detail.profesional
  const proPendiente =
    pro &&
    (pro.estado === "pendiente" || pro.estado === "cambios_solicitados")

  return (
    <DashboardShell
      title={detail.name}
      subtitle="Perfil y decisiones de rol"
      tabs={tabs}
    >
      <div className="mb-4">
        <Button variant="outline" size="sm" render={<Link href="/admin/usuarios" />}>
          ← Volver a usuarios
        </Button>
      </div>

      {error ? (
        <p className="mb-4 text-sm text-destructive">{error}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section className="space-y-4 rounded-xl border border-border bg-background p-5">
          <h2 className="font-serif text-xl text-foreground">Perfil</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Correo</dt>
              <dd className="font-medium text-foreground">{detail.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Celular</dt>
              <dd className="font-medium text-foreground">
                {detail.celular || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Registro</dt>
              <dd className="font-medium text-foreground">
                {detail.created_at
                  ? new Date(detail.created_at).toLocaleString("es-CO")
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Roles Spatie</dt>
              <dd className="font-medium text-foreground">
                {detail.roles.map((r) => ROLE_LABEL[r] ?? r).join(" · ") ||
                  "—"}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2 pt-2">
            {(
              [
                ["ciudadano", "Ciudadano"],
                ["moderador", "Moderador"],
                ["voluntario", "Voluntario"],
                ["profesional", "Profesional"],
              ] as const
            ).map(([key, label]) => (
              <div
                key={key}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="text-muted-foreground">{label}</span>
                <StatusBadge status={detail.roles_status?.[key]} />
              </div>
            ))}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-foreground">
              Municipios asignados
            </h3>
            <p className="text-sm text-muted-foreground">
              {detail.municipios.length > 0
                ? detail.municipios.map((m) => m.nombre).join(", ")
                : "Sin municipios de moderación/voluntariado."}
            </p>
          </div>

          {pro ? (
            <div className="space-y-2 border-t border-border pt-4">
              <h3 className="text-sm font-medium text-foreground">
                Perfil profesional
              </h3>
              <p className="text-sm text-foreground">
                <span className="font-medium">{pro.nombre}</span>
                {pro.area_label ? ` · ${pro.area_label}` : ""}
              </p>
              <p className="text-sm text-muted-foreground">{pro.titulo}</p>
              <p className="text-sm text-muted-foreground">{pro.descripcion}</p>
              <p className="text-xs text-muted-foreground">
                Estado: {pro.estado_label ?? pro.estado}
                {pro.modalidad_label ? ` · ${pro.modalidad_label}` : ""}
                {pro.disponibilidad ? ` · ${pro.disponibilidad}` : ""}
              </p>
              {pro.documentos && pro.documentos.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {pro.documentos.map((d) => (
                    <li key={d.id}>
                      {d.url ? (
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline-offset-2 hover:underline"
                        >
                          {d.nombre_original}
                        </a>
                      ) : (
                        d.nombre_original
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          <h2 className="font-serif text-xl text-foreground">Decisiones</h2>

          {solicitudes.length === 0 && !proPendiente ? (
            <p className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              No hay roles pendientes de aprobación para esta persona.
            </p>
          ) : null}

          {solicitudes.map((s) => {
            const key = `sol-${s.id}`
            return (
              <div
                key={s.id}
                className="space-y-3 rounded-xl border border-border bg-background p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">
                      Solicitud:{" "}
                      {s.rol === "moderador" ? "Moderador" : "Voluntario"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {s.mensaje || "Sin mensaje."}
                    </p>
                    {s.municipios.length > 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Municipios:{" "}
                        {s.municipios.map((m) => m.nombre).join(", ")}
                      </p>
                    ) : null}
                  </div>
                  <StatusBadge status="pending" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`nota-${key}`}>Nota si rechazas</Label>
                  <Textarea
                    id={`nota-${key}`}
                    value={notaByKey[key] ?? ""}
                    onChange={(e) =>
                      setNotaByKey((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="Motivo del rechazo"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void onAprobarSolicitud(s)}
                  >
                    {busy === key ? "…" : "Aprobar"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy !== null}
                    onClick={() => void onRechazarSolicitud(s)}
                  >
                    Rechazar
                  </Button>
                </div>
              </div>
            )
          })}

          {proPendiente && pro ? (
            <div className="space-y-3 rounded-xl border border-border bg-background p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-foreground">
                    Perfil profesional
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {pro.estado_label ?? pro.estado}
                  </p>
                </div>
                <StatusBadge status="pending" />
              </div>
              {!canModerateProf ? (
                <p className="text-sm text-muted-foreground">
                  Tu cuenta no tiene permiso para moderar profesionales.
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor={`nota-pro-${pro.id}`}>
                      Nota si rechazas
                    </Label>
                    <Textarea
                      id={`nota-pro-${pro.id}`}
                      value={notaByKey[`pro-${pro.id}`] ?? ""}
                      onChange={(e) =>
                        setNotaByKey((prev) => ({
                          ...prev,
                          [`pro-${pro.id}`]: e.target.value,
                        }))
                      }
                      rows={2}
                      placeholder="Motivo del rechazo"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void onAprobarProfesional(pro.id)}
                    >
                      {busy === `pro-${pro.id}` ? "…" : "Aprobar"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy !== null}
                      onClick={() => void onRechazarProfesional(pro.id)}
                    >
                      Rechazar
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </aside>
      </div>
    </DashboardShell>
  )
}
