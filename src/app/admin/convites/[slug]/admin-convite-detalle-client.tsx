"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Button } from "@/components/ui/button"
import { useRequireRoleTree } from "@/hooks/use-require-role-tree"
import { ApiError } from "@/lib/api"
import {
  fetchAdminIniciativa,
  fetchAdminIniciativaAportes,
  type ApiAdminIniciativaDetalle,
} from "@/lib/convites-api"
import type { ApiAporte } from "@/lib/types"

export function AdminConviteDetalleClient() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const { token, loading: authLoading, hasPermission } = useRequireRoleTree(
    `/admin/convites/${slug}`,
    "admin",
  )
  const canManage = hasPermission("users.manage")

  const [detalle, setDetalle] = useState<ApiAdminIniciativaDetalle | null>(null)
  const [aportes, setAportes] = useState<ApiAporte[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token || !slug) return
    setLoading(true)
    setError(null)
    try {
      const [d, a] = await Promise.all([
        fetchAdminIniciativa(token, slug),
        fetchAdminIniciativaAportes(token, slug),
      ])
      setDetalle(d)
      setAportes(a)
    } catch (err) {
      setDetalle(null)
      setAportes([])
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos cargar el detalle."
          : "No pudimos cargar el detalle.",
      )
    } finally {
      setLoading(false)
    }
  }, [token, slug])

  useEffect(() => {
    if (authLoading || !token || !canManage) {
      setLoading(false)
      return
    }
    void load()
  }, [authLoading, token, canManage, load])

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-muted-foreground">
        Cargando…
      </div>
    )
  }

  if (!token || !canManage) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-serif text-2xl text-foreground">Sin acceso</h1>
      </div>
    )
  }

  return (
    <DashboardShell
      title={detalle?.titulo ?? "Convite"}
      subtitle="Detalle admin: verificación, historial de moderación y aportantes (incl. anónimos)."
      tabs={[
        { href: "/admin", label: "Usuarios" },
        { href: "/admin/convites", label: "Convites", active: true },
        { href: "/moderacion", label: "Moderación" },
      ]}
    >
      <div className="mb-6">
        <Button variant="ghost" render={<Link href="/admin/convites" />}>
          ← Volver al listado
        </Button>
      </div>

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      {!detalle ? (
        <p className="text-sm text-muted-foreground">No encontrado.</p>
      ) : (
        <div className="space-y-10">
          <section className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Estado:</span>{" "}
              {detalle.estado_label ?? detalle.estado}
            </p>
            <p>
              <span className="text-muted-foreground">Municipio:</span>{" "}
              {detalle.municipio?.nombre ?? "—"}
              {detalle.municipio?.departamento
                ? ` (${detalle.municipio.departamento.nombre})`
                : ""}
            </p>
            <p>
              <span className="text-muted-foreground">Creador:</span>{" "}
              {detalle.creador?.name ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Slug:</span> {detalle.slug}
            </p>
            {detalle.nota_moderacion ? (
              <p>
                <span className="text-muted-foreground">Nota moderación:</span>{" "}
                {detalle.nota_moderacion}
              </p>
            ) : null}
          </section>

          {detalle.verificacion ? (
            <section>
              <h2 className="mb-3 font-serif text-xl text-foreground">Verificación</h2>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Responsable</dt>
                  <dd>{detalle.verificacion.persona_responsable ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Quién respalda</dt>
                  <dd>{detalle.verificacion.quien_respalda ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Teléfono</dt>
                  <dd>{detalle.verificacion.telefono_contacto ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Lugar exacto</dt>
                  <dd>{detalle.verificacion.lugar_exacto ?? "—"}</dd>
                </div>
              </dl>
            </section>
          ) : null}

          <section>
            <h2 className="mb-3 font-serif text-xl text-foreground">
              Historial de moderación
            </h2>
            {!detalle.moderacion_historial?.length ? (
              <p className="text-sm text-muted-foreground">Sin acciones registradas.</p>
            ) : (
              <ol className="space-y-3 border-l border-border pl-4">
                {detalle.moderacion_historial.map((h) => (
                  <li key={h.id} className="text-sm">
                    <p className="font-medium text-foreground">
                      {h.accion ?? "acción"}
                      {h.estado_anterior || h.estado_nuevo
                        ? `: ${h.estado_anterior ?? "?"} → ${h.estado_nuevo ?? "?"}`
                        : ""}
                    </p>
                    <p className="text-muted-foreground">
                      {h.moderador?.name ?? "—"}
                      {h.created_at
                        ? ` · ${new Date(h.created_at).toLocaleString("es-CO")}`
                        : ""}
                    </p>
                    {h.nota ? <p className="mt-1">{h.nota}</p> : null}
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-serif text-xl text-foreground">Aportes</h2>
            {aportes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin aportes.</p>
            ) : (
              <ul className="space-y-3">
                {aportes.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-lg border border-border px-4 py-3 text-sm"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="font-medium">
                        {a.aportante?.name ?? "—"}
                        {a.anonimo ? " (marcado anónimo)" : ""}
                      </span>
                      <span className="text-muted-foreground">
                        {a.estado_label ?? a.estado}
                      </span>
                    </div>
                    {a.items?.length ? (
                      <p className="mt-1 text-muted-foreground">
                        {a.items
                          .map(
                            (it) =>
                              `${it.cantidad}${it.unidad ? ` ${it.unidad}` : ""} ${it.nombre ?? ""}`,
                          )
                          .join(", ")}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </DashboardShell>
  )
}
