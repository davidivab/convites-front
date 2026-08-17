"use client"

import { useCallback, useEffect, useState } from "react"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MunicipiosMultiSelect } from "@/components/ui/municipios-multi-select"
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
  createAdminUser,
  fetchAdminUsers,
  type ApiAdminUser,
} from "@/lib/convites-api"

export function AdminClient() {
  const { token, loading: authLoading, hasPermission } = useRequireRoleTree(
    "/admin",
    "admin",
  )
  const canManage = hasPermission("users.manage")

  const [users, setUsers] = useState<ApiAdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [celular, setCelular] = useState("")
  const [role, setRole] = useState<"moderator" | "voluntario">("moderator")
  const [municipioIds, setMunicipioIds] = useState<number[]>([])

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminUsers(token)
      setUsers(data)
    } catch (err) {
      setUsers([])
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos cargar usuarios."
          : "No pudimos cargar usuarios.",
      )
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

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!token || submitting || municipioIds.length === 0) return
    setSubmitting(true)
    setError(null)
    try {
      await createAdminUser(token, {
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: password,
        celular: celular.trim() || null,
        role,
        municipio_ids: municipioIds,
      })
      setName("")
      setEmail("")
      setPassword("")
      setCelular("")
      setMunicipioIds([])
      await load()
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos crear el usuario."
          : "No pudimos crear el usuario.",
      )
    } finally {
      setSubmitting(false)
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
        <p className="mt-2 text-sm text-muted-foreground">
          Solo administradores pueden gestionar moderadores y voluntarios.
        </p>
      </div>
    )
  }

  return (
    <DashboardShell
      title="Administración"
      subtitle="Crea moderadores y voluntarios y asígnales municipios activos."
      tabs={[
        { href: "/admin", label: "Usuarios", active: true },
        { href: "/admin/convites", label: "Convites" },
        { href: "/moderacion", label: "Moderación" },
      ]}
    >
      {error ? (
        <p className="mb-4 text-sm text-destructive">{error}</p>
      ) : null}

      <form
        onSubmit={(e) => void onCreate(e)}
        className="mb-10 space-y-5 rounded-xl border border-border bg-card p-5 md:p-6"
      >
        <h2 className="font-serif text-xl text-foreground">Nuevo usuario</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="admin-name">Nombre</Label>
            <Input
              id="admin-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-email">Correo</Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-pass">Contraseña</Label>
            <Input
              id="admin-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-cel">Celular (opcional)</Label>
            <Input
              id="admin-cel"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-role">Rol</Label>
            <Select
              value={role}
              onValueChange={(v) =>
                setRole((v as "moderator" | "voluntario") || "moderator")
              }
              items={[
                { value: "moderator", label: "Moderador" },
                { value: "voluntario", label: "Voluntario" },
              ]}
            >
              <SelectTrigger id="admin-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="moderator">Moderador</SelectItem>
                <SelectItem value="voluntario">Voluntario</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <MunicipiosMultiSelect value={municipioIds} onChange={setMunicipioIds} />

        <Button
          type="submit"
          disabled={
            submitting ||
            !name.trim() ||
            !email.trim() ||
            password.length < 8 ||
            municipioIds.length === 0
          }
        >
          {submitting ? "Creando…" : "Crear usuario"}
        </Button>
      </form>

      <h2 className="mb-4 font-serif text-xl text-foreground">
        Moderadores y voluntarios
      </h2>
      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aún no hay moderadores ni voluntarios creados por admin.
        </p>
      ) : (
        <ul className="space-y-3">
          {users.map((u) => (
            <li
              key={u.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-foreground">{u.name}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                </div>
                <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-foreground">
                  {u.roles.join(", ")}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Municipios:{" "}
                {u.municipios.length > 0
                  ? u.municipios.map((m) => m.nombre).join(", ")
                  : "sin asignar"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  )
}
