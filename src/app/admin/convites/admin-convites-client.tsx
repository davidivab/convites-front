"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Button } from "@/components/ui/button"
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table"
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
import { perfilTabsForRole } from "@/lib/role-tree"

const ESTADOS = [
  { value: "todas", label: "Todas" },
  { value: "borrador", label: "Borrador" },
  { value: "en_revision", label: "En revisión" },
  { value: "publicada", label: "Publicada" },
  { value: "en_curso", label: "En curso" },
  { value: "cerrada", label: "Cerrada" },
  { value: "rechazada", label: "Rechazada" },
]

function formatProgreso(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—"
  return `${Math.round(value)}%`
}

function contactoLabel(ini: ApiIniciativa): string {
  const nombre = ini.creador?.name?.trim()
  const tel =
    ini.verificacion?.telefono_contacto?.trim() ||
    ("telefono_contacto" in ini &&
    typeof (ini as { telefono_contacto?: string | null }).telefono_contacto ===
      "string"
      ? (ini as { telefono_contacto?: string | null }).telefono_contacto
      : null)
  if (nombre && tel) return `${nombre} · ${tel}`
  if (nombre) return nombre
  if (tel) return tel
  return "—"
}

export function AdminConvitesClient() {
  const { user, token, loading: authLoading, hasPermission } = useRequireRoleTree(
    "/admin/convites",
    "admin",
  )
  const canManage = hasPermission("users.manage")

  const [items, setItems] = useState<ApiIniciativa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [estado, setEstado] = useState("todas")
  const [qDraft, setQDraft] = useState("")
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<{
    current_page: number
    last_page: number
    total: number
  }>({ current_page: 1, last_page: 1, total: 0 })

  // Búsqueda inteligente: desde la 3ª letra (debounce 300ms).
  useEffect(() => {
    const trimmed = qDraft.trim()
    const handle = window.setTimeout(() => {
      if (trimmed.length === 0) {
        setQ("")
        setPage(1)
        return
      }
      if (trimmed.length >= 3) {
        setQ(trimmed)
        setPage(1)
      }
    }, 300)
    return () => window.clearTimeout(handle)
  }, [qDraft])

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetchAdminIniciativas(token, {
        estado: estado === "todas" ? undefined : estado,
        q: q.trim() || undefined,
        per_page: 20,
        page,
      })
      setItems(res.data)
      setMeta({
        current_page: res.meta?.current_page ?? page,
        last_page: res.meta?.last_page ?? 1,
        total: res.meta?.total ?? res.data.length,
      })
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
  }, [token, estado, q, page])

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

  const searchHint =
    qDraft.trim().length > 0 && qDraft.trim().length < 3
      ? "Escribe al menos 3 letras para buscar"
      : null

  const columns = useMemo((): Array<DataTableColumn<ApiIniciativa>> => {
    return [
      {
        id: "titulo",
        header: "Convite",
        minWidth: "14rem",
        cell: (ini) => (
          <>
            <Link
              href={`/admin/convites/${ini.slug}`}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {ini.titulo}
            </Link>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {ini.municipio?.nombre ?? "Sin municipio"}
              {ini.municipio?.departamento
                ? ` · ${ini.municipio.departamento.nombre}`
                : ""}
            </p>
          </>
        ),
      },
      {
        id: "estado",
        header: "Estado",
        width: "8rem",
        cellClassName: "text-muted-foreground",
        cell: (ini) => ini.estado_label ?? ini.estado,
      },
      {
        id: "progreso",
        header: "Evolución",
        width: "6rem",
        cellClassName: "font-mono tabular-nums text-foreground",
        cell: (ini) => formatProgreso(ini.progreso),
      },
      {
        id: "contacto",
        header: "Contacto",
        minWidth: "10rem",
        cellClassName: "text-muted-foreground",
        cell: (ini) => contactoLabel(ini),
      },
      {
        id: "acciones",
        header: "Acciones",
        srOnlyHeader: true,
        width: "5.5rem",
        align: "right",
        cell: (ini) => (
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/admin/convites/${ini.slug}`} />}
            onClick={(e) => e.stopPropagation()}
          >
            Editar
          </Button>
        ),
      },
    ]
  }, [])

  return (
    <DashboardShell
      title="Auditoría de convites"
      subtitle="Listado completo sin filtro de municipio. Abre un convite para ver historial de moderación y aportantes."
      tabs={perfilTabsForRole(user, "/admin/convites")}
    >
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      <DataTable
        columns={columns}
        data={items}
        getRowId={(ini) => ini.id}
        loading={loading}
        empty="No hay convites con esos filtros."
        showColumnToggle
        toolbar={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-[10rem] space-y-2">
              <Label htmlFor="admin-estado">Estado</Label>
              <Select
                value={estado}
                onValueChange={(v) => {
                  setEstado(v || "todas")
                  setPage(1)
                }}
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
            <div className="min-w-[14rem] flex-1 space-y-2">
              <Label htmlFor="admin-q">Buscar</Label>
              <Input
                id="admin-q"
                value={qDraft}
                onChange={(e) => setQDraft(e.target.value)}
                placeholder="Desde 3 letras: título, resumen o slug"
                autoComplete="off"
              />
              {searchHint ? (
                <p className="text-xs text-muted-foreground">{searchHint}</p>
              ) : null}
            </div>
          </div>
        }
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {meta.total} convite{meta.total === 1 ? "" : "s"}
              {meta.last_page > 1
                ? ` · página ${meta.current_page} de ${meta.last_page}`
                : ""}
            </p>
            {meta.last_page > 1 ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.last_page || loading}
                  onClick={() =>
                    setPage((p) => Math.min(meta.last_page, p + 1))
                  }
                >
                  Siguiente
                </Button>
              </div>
            ) : null}
          </div>
        }
      />
    </DashboardShell>
  )
}
