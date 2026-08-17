"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRequireRoleTree } from "@/hooks/use-require-role-tree"
import { ApiError } from "@/lib/api"
import {
  fetchAdminIniciativas,
  type ApiIniciativa,
} from "@/lib/convites-api"

const ESTADOS = [
  { value: "todas", label: "Todas" },
  { value: "borrador", label: "Borrador" },
  { value: "en_revision", label: "En revisión" },
  { value: "publicada", label: "Publicada" },
  { value: "en_curso", label: "En curso" },
  { value: "cerrada", label: "Cerrada" },
  { value: "rechazada", label: "Rechazada" },
]

export function AdminConvitesClient() {
  const { token, loading: authLoading, hasPermission } = useRequireRoleTree(
    "/admin/convites",
    "admin",
  )
  const canManage = hasPermission("users.manage")

  const [items, setItems] = useState<ApiIniciativa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [estado, setEstado] = useState("todas")
  const [q, setQ] = useState("")
  const [qDraft, setQDraft] = useState("")

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetchAdminIniciativas(token, {
        estado: estado === "todas" ? undefined : estado,
        q: q.trim() || undefined,
        per_page: 50,
      })
      setItems(res.data)
    } catch (err) {
      setItems([])
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos cargar convites."
          : "No pudimos cargar convites.",
      )
    } finally {
      setLoading(false)
    }
  }, [token, estado, q])

  useEffect(() => {
    if (authLoading || !token || !canManage) {
      setLoading(false)
      return
    }
    void load()
  }, [authLoading, token, canManage, load])

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
        <p className="mt-2 text-sm text-muted-foreground">
          Solo administradores pueden auditar todos los convites.
        </p>
      </div>
    )
  }

  return (
    <DashboardShell
      title="Auditoría de convites"
      subtitle="Listado completo sin filtro de municipio. Abre un convite para ver historial de moderación y aportantes."
      tabs={[
        { href: "/admin", label: "Usuarios" },
        { href: "/admin/convites", label: "Convites", active: true },
        { href: "/moderacion", label: "Moderación" },
      ]}
    >
      <form
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault()
          setQ(qDraft)
        }}
      >
        <div className="min-w-[10rem] space-y-2">
          <Label htmlFor="admin-estado">Estado</Label>
          <Select
            value={estado}
            onValueChange={(v) => setEstado(v || "todas")}
            items={ESTADOS}
          >
            <SelectTrigger id="admin-estado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS.map((e) => (
                <SelectItem key={e.value} value={e.value}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="admin-q">Buscar</Label>
          <Input
            id="admin-q"
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
            placeholder="Título, resumen o slug"
          />
        </div>
        <Button type="submit">Filtrar</Button>
      </form>

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay convites con esos filtros.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {items.map((ini) => (
            <li key={ini.id} className="py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/admin/convites/${ini.slug}`}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {ini.titulo}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {ini.municipio?.nombre ?? "Sin municipio"}
                    {ini.municipio?.departamento
                      ? ` · ${ini.municipio.departamento.nombre}`
                      : ""}
                    {" · "}
                    {ini.estado_label ?? ini.estado}
                    {ini.urgencia ? ` · urgencia ${ini.urgencia}` : ""}
                  </p>
                </div>
                <Button variant="outline" size="sm" render={<Link href={`/admin/convites/${ini.slug}`} />}>
                  Ver detalle
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  )
}
