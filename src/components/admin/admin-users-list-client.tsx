"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Check, TriangleAlert, Search } from "lucide-react"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import {
  DataTable,
  type DataTableColumn,
  type DataTableSortState,
} from "@/components/ui/data-table"
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
  fetchAdminUsers,
  type AdminRoleStatus,
  type AdminUserTipo,
  type ApiAdminUser,
} from "@/lib/convites-api"
import { useAdminPerfilTabs } from "@/components/admin/use-admin-perfil-tabs"

const SORT_VALUES = ["name", "email", "created_at"] as const
type SortKey = (typeof SORT_VALUES)[number]

const TIPO_OPTIONS: Array<{ value: AdminUserTipo; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "ciudadano", label: "Ciudadanos" },
  { value: "moderador", label: "Moderadores" },
  { value: "voluntario", label: "Voluntarios" },
  { value: "profesional", label: "Profesionales" },
  { value: "pendientes", label: "Pendientes de aprobación" },
]

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

function parseTipo(raw: string | null): AdminUserTipo {
  const found = TIPO_OPTIONS.find((o) => o.value === raw)
  return found?.value ?? "todos"
}

function buildUsersQuery(opts: {
  q: string
  tipo: AdminUserTipo
  sort: SortKey
  order: "asc" | "desc"
  page: number
}): string {
  const params = new URLSearchParams()
  if (opts.tipo !== "todos") params.set("tipo", opts.tipo)
  if (opts.q) params.set("q", opts.q)
  if (opts.sort !== "name") params.set("sort", opts.sort)
  if (opts.order !== "asc") params.set("order", opts.order)
  if (opts.page > 1) params.set("page", String(opts.page))
  const s = params.toString()
  return s ? `?${s}` : ""
}

function RoleStatusCell({ status }: { status: AdminRoleStatus }) {
  if (status === "active") {
    return (
      <span
        className="inline-flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary"
        title="Activo"
      >
        <Check className="size-4" aria-hidden />
        <span className="sr-only">Activo</span>
      </span>
    )
  }
  if (status === "pending") {
    return (
      <span
        className="inline-flex size-7 items-center justify-center rounded-md bg-warning/15 text-warning"
        title="Pendiente de aprobación"
      >
        <TriangleAlert className="size-4" aria-hidden />
        <span className="sr-only">Pendiente</span>
      </span>
    )
  }
  return <span className="text-muted-foreground">—</span>
}

function statusOf(
  u: ApiAdminUser,
  key: keyof NonNullable<ApiAdminUser["roles_status"]>,
): AdminRoleStatus {
  return u.roles_status?.[key] ?? "none"
}

export function AdminUsersListClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { user, token, loading: authLoading, hasPermission } = useRequireRoleTree(
    "/admin/usuarios",
    "admin",
  )
  const canManage = hasPermission("users.manage")
  const tabs = useAdminPerfilTabs(user, token, "/admin/usuarios")

  const q = (searchParams.get("q") ?? "").trim()
  const tipo = parseTipo(searchParams.get("tipo"))
  const sort = parseSort(searchParams.get("sort"))
  const order = parseOrder(searchParams.get("order"))
  const page = parsePage(searchParams.get("page"))

  const [qDraft, setQDraft] = useState(q)
  const [tipoDraft, setTipoDraft] = useState<AdminUserTipo>(tipo)
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
    setTipoDraft(tipo)
  }, [q, tipo])

  function replaceQuery(next: {
    q?: string
    tipo?: AdminUserTipo
    sort?: SortKey
    order?: "asc" | "desc"
    page?: number
  }) {
    const href =
      pathname +
      buildUsersQuery({
        q: next.q !== undefined ? next.q.trim() : q,
        tipo: next.tipo ?? tipo,
        sort: next.sort ?? sort,
        order: next.order ?? order,
        page: next.page ?? page,
      })
    router.replace(href, { scroll: false })
  }

  function applyFilters(e?: React.FormEvent) {
    e?.preventDefault()
    replaceQuery({
      q: qDraft.trim(),
      tipo: tipoDraft,
      page: 1,
    })
  }

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetchAdminUsers(token, {
        tipo,
        todos: true,
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
  }, [token, tipo, q, sort, order, page])

  useEffect(() => {
    if (authLoading || !token || !canManage) {
      setLoading(false)
      return
    }
    void load()
  }, [authLoading, token, canManage, load])

  const columns = useMemo((): Array<DataTableColumn<ApiAdminUser>> => {
    return [
      {
        id: "name",
        header: "Nombre",
        sortable: true,
        minWidth: "10rem",
        cell: (u) => (
          <Link
            href={`/admin/usuarios/${u.id}`}
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            {u.name}
          </Link>
        ),
      },
      {
        id: "email",
        header: "Correo / celular",
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
        id: "ciudadano",
        header: "Ciudadano",
        width: "6.5rem",
        cellClassName: "text-center",
        cell: (u) => <RoleStatusCell status={statusOf(u, "ciudadano")} />,
      },
      {
        id: "moderador",
        header: "Moderador",
        width: "6.5rem",
        cellClassName: "text-center",
        cell: (u) => <RoleStatusCell status={statusOf(u, "moderador")} />,
      },
      {
        id: "voluntario",
        header: "Voluntario",
        width: "6.5rem",
        cellClassName: "text-center",
        cell: (u) => <RoleStatusCell status={statusOf(u, "voluntario")} />,
      },
      {
        id: "profesional",
        header: "Profesional",
        width: "6.5rem",
        cellClassName: "text-center",
        cell: (u) => <RoleStatusCell status={statusOf(u, "profesional")} />,
      },
      {
        id: "created_at",
        header: "Registro",
        sortable: true,
        width: "7.5rem",
        cellClassName: "text-muted-foreground tabular-nums",
        cell: (u) =>
          u.created_at
            ? new Date(u.created_at).toLocaleDateString("es-CO")
            : "—",
      },
    ]
  }, [])

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
      title="Usuarios"
      subtitle="Todas las cuentas. El check es rol activo; el aviso amarillo es solicitud pendiente."
      tabs={tabs}
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
          <form
            onSubmit={applyFilters}
            className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
          >
            <div className="min-w-[12rem] flex-1 space-y-2">
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
            <div className="w-full space-y-2 sm:w-56">
              <Label htmlFor="admin-users-tipo">Tipo de usuario</Label>
              <Select
                value={tipoDraft}
                onValueChange={(v) => {
                  if (v) setTipoDraft(parseTipo(v))
                }}
                items={TIPO_OPTIONS}
              >
                <SelectTrigger id="admin-users-tipo" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="sm:mb-0.5">
              Filtrar
            </Button>
          </form>
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
