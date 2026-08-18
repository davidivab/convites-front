"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import {
  DataTable,
  type DataTableColumn,
  type DataTableSortState,
} from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRequireRoleTree } from "@/hooks/use-require-role-tree"
import { ApiError } from "@/lib/api"
import { fetchAdminUsers, type ApiAdminUser } from "@/lib/convites-api"
import { perfilTabsForRole } from "@/lib/role-tree"
import { Search } from "lucide-react"

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  moderator: "Moderador",
  voluntario: "Voluntario",
  member: "Ciudadano",
  profesional: "Profesional",
}

const SORT_VALUES = ["name", "email", "created_at"] as const
type SortKey = (typeof SORT_VALUES)[number]

function parseSort(raw: string | null): SortKey {
  if (raw && (SORT_VALUES as readonly string[]).includes(raw)) {
    return raw as SortKey
  }
  return "name"
}

function parseOrder(raw: string | null): "asc" | "desc" {
  return raw === "desc" ? "desc" : "asc"
}

function parsePage(raw: string | null): number {
  const n = Number(raw)
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1
}

function funcionLabel(roles: string[]): string {
  if (roles.length === 0) return "Sin rol"
  return roles.map((r) => ROLE_LABEL[r] ?? r).join(" · ")
}

function buildUsersQuery(opts: {
  q: string
  sort: SortKey
  order: "asc" | "desc"
  page: number
}): string {
  const params = new URLSearchParams()
  if (opts.q) params.set("q", opts.q)
  if (opts.sort !== "name") params.set("sort", opts.sort)
  if (opts.order !== "asc") params.set("order", opts.order)
  if (opts.page > 1) params.set("page", String(opts.page))
  const s = params.toString()
  return s ? `?${s}` : ""
}

export function AdminUsersListClient({
  title,
  subtitle,
  activePath,
  listMode,
}: {
  title: string
  subtitle: string
  activePath: string
  listMode: "all" | "moderator" | "voluntario"
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { user, token, loading: authLoading, hasPermission } = useRequireRoleTree(
    activePath,
    "admin",
  )
  const canManage = hasPermission("users.manage")

  const q = (searchParams.get("q") ?? "").trim()
  const sort = parseSort(searchParams.get("sort"))
  const order = parseOrder(searchParams.get("order"))
  const page = parsePage(searchParams.get("page"))

  const [qDraft, setQDraft] = useState(q)
  const [items, setItems] = useState<ApiAdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<{
    current_page: number
    last_page: number
    total: number
  }>({ current_page: 1, last_page: 1, total: 0 })

  useEffect(() => {
    setQDraft(q)
  }, [q])

  function replaceQuery(next: {
    q?: string
    sort?: SortKey
    order?: "asc" | "desc"
    page?: number
  }) {
    const href =
      pathname +
      buildUsersQuery({
        q: next.q !== undefined ? next.q.trim() : q,
        sort: next.sort ?? sort,
        order: next.order ?? order,
        page: next.page ?? page,
      })
    router.replace(href, { scroll: false })
  }

  useEffect(() => {
    const trimmed = qDraft.trim()
    if (trimmed === q) return
    const handle = window.setTimeout(() => {
      const href =
        pathname +
        buildUsersQuery({
          q: trimmed,
          sort,
          order,
          page: 1,
        })
      router.replace(href, { scroll: false })
    }, 300)
    return () => window.clearTimeout(handle)
  }, [qDraft, q, pathname, sort, order, router])

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetchAdminUsers(token, {
        ...(listMode === "all" ? { scope: "all" } : { role: listMode }),
        q: q || undefined,
        sort,
        order,
        page,
        per_page: 30,
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
          ? err.body.message || "No pudimos cargar usuarios."
          : "No pudimos cargar usuarios.",
      )
    } finally {
      setLoading(false)
    }
  }, [token, listMode, q, sort, order, page])

  useEffect(() => {
    if (authLoading || !token || !canManage) {
      setLoading(false)
      return
    }
    void load()
  }, [authLoading, token, canManage, load])

  const columns = useMemo((): Array<DataTableColumn<ApiAdminUser>> => {
    const cols: Array<DataTableColumn<ApiAdminUser>> = [
      {
        id: "name",
        header: "Nombre",
        sortable: true,
        minWidth: "10rem",
        cell: (u) => (
          <span className="font-medium text-foreground">{u.name}</span>
        ),
      },
      {
        id: "email",
        header: "Correo",
        sortable: true,
        minWidth: "14rem",
        cell: (u) => (
          <span className="text-muted-foreground">
            {u.email}
            {u.celular ? (
              <span className="mt-0.5 block text-xs">{u.celular}</span>
            ) : null}
          </span>
        ),
      },
      {
        id: "roles",
        header: "Función",
        width: "11rem",
        cell: (u) => (
          <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium">
            {funcionLabel(u.roles)}
          </span>
        ),
      },
    ]

    if (listMode !== "all") {
      cols.push({
        id: "municipios",
        header: "Municipios",
        minWidth: "12rem",
        cell: (u) => (
          <span className="text-muted-foreground">
            {u.municipios.length > 0
              ? u.municipios.map((m) => m.nombre).join(", ")
              : "sin asignar"}
          </span>
        ),
      })
    }

    cols.push({
      id: "created_at",
      header: "Registro",
      sortable: true,
      width: "7.5rem",
      cellClassName: "text-muted-foreground tabular-nums",
      cell: (u) =>
        u.created_at
          ? new Date(u.created_at).toLocaleDateString("es-CO")
          : "—",
    })

    return cols
  }, [listMode])

  const tableSort: DataTableSortState = { id: sort, order }

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
          Solo administradores pueden ver esta sección.
        </p>
      </div>
    )
  }

  return (
    <DashboardShell
      title={title}
      subtitle={subtitle}
      tabs={perfilTabsForRole(user, activePath)}
    >
      {error ? (
        <p className="mb-4 text-sm text-destructive">{error}</p>
      ) : null}

      <DataTable
        columns={columns}
        data={items}
        getRowId={(u) => u.id}
        loading={loading}
        empty="No hay resultados con esos filtros."
        sort={tableSort}
        onSortChange={(next) => {
          if (!(SORT_VALUES as readonly string[]).includes(next.id)) return
          replaceQuery({
            sort: next.id as SortKey,
            order: next.order,
            page: 1,
          })
        }}
        showColumnToggle
        toolbar={
          <div className="min-w-[14rem] max-w-md flex-1 space-y-2">
            <Label htmlFor="admin-users-q">Buscar</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="admin-users-q"
                value={qDraft}
                onChange={(e) => setQDraft(e.target.value)}
                placeholder="Nombre, correo o celular"
                className="pl-9"
              />
            </div>
          </div>
        }
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {meta.total} registro{meta.total === 1 ? "" : "s"}
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
                  onClick={() => replaceQuery({ page: Math.max(1, page - 1) })}
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.last_page || loading}
                  onClick={() => replaceQuery({ page: page + 1 })}
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
