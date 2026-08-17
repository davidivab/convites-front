"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { ApiError } from "@/lib/api"
import {
  fetchMiPerfilProfesional,
  fetchMisSolicitudesProfesional,
  updateMiPerfilProfesional,
  type ApiMiPerfilProfesional,
  type ApiProfesionalSolicitud,
} from "@/lib/convites-api"
import { canAccessProfesionalPanel } from "@/lib/role-tree"
import { PhoneInput, isPhoneValid } from "@/components/ui/phone-input"

const MODALIDADES = [
  { value: "presencial", label: "Presencial" },
  { value: "virtual", label: "Virtual" },
  { value: "presencial_y_virtual", label: "Presencial y virtual" },
]

export function PanelProfesionalClient() {
  const auth = useRequireAuth("/panel/profesional")
  const { token, user, loading: authLoading, hasPermission } = auth
  const allowed = canAccessProfesionalPanel(user) || hasPermission("profesional_perfil.view_own")

  const [perfil, setPerfil] = useState<ApiMiPerfilProfesional | null>(null)
  const [solicitudes, setSolicitudes] = useState<ApiProfesionalSolicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  const [titulo, setTitulo] = useState("")
  const [celular, setCelular] = useState("")
  const [modalidad, setModalidad] = useState("presencial")
  const [disponibilidad, setDisponibilidad] = useState("")
  const [descripcion, setDescripcion] = useState("")

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const [p, s] = await Promise.all([
        fetchMiPerfilProfesional(token),
        fetchMisSolicitudesProfesional(token),
      ])
      setPerfil(p)
      setSolicitudes(s)
      setTitulo(p.titulo ?? "")
      setCelular(p.celular ?? "")
      setModalidad(p.modalidad ?? "presencial")
      setDisponibilidad(p.disponibilidad ?? "")
      setDescripcion(p.descripcion ?? "")
    } catch (err) {
      setPerfil(null)
      setSolicitudes([])
      setError(
        err instanceof ApiError && err.status === 404
          ? "Aún no tienes perfil profesional. Regístrate en Manos profesionales."
          : err instanceof ApiError
            ? err.body.message || "No pudimos cargar tu panel."
            : "No pudimos cargar tu panel.",
      )
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (authLoading || !token || !allowed) {
      setLoading(false)
      return
    }
    void load()
  }, [authLoading, token, allowed, load])

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!token || saving) return
    if (celular && !isPhoneValid(celular, false)) {
      setError("Revisa el número de celular.")
      return
    }
    setSaving(true)
    setError(null)
    setSavedMsg(null)
    try {
      const updated = await updateMiPerfilProfesional(token, {
        titulo: titulo.trim(),
        celular: celular.trim() || null,
        modalidad,
        disponibilidad: disponibilidad.trim(),
        descripcion: descripcion.trim(),
      })
      setPerfil(updated)
      setSavedMsg("Cambios guardados.")
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos guardar."
          : "No pudimos guardar.",
      )
    } finally {
      setSaving(false)
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

  if (!allowed) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-serif text-2xl text-foreground">Sin acceso</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Este panel es para cuentas con perfil profesional registrado.
        </p>
        <Button className="mt-4" render={<Link href="/registro-profesional" />}>
          Registrarme como profesional
        </Button>
      </div>
    )
  }

  const tabs = [
    { href: "/panel/aportante", label: "Aportante" },
    { href: "/panel/creador", label: "Organizador" },
    { href: "/panel/profesional", label: "Profesional", active: true },
  ]

  return (
    <DashboardShell
      title="Mi perfil profesional"
      subtitle="Gestiona cómo te ven en Manos profesionales y responde a quienes te contactan."
      tabs={tabs}
    >
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      {savedMsg ? <p className="mb-4 text-sm text-primary">{savedMsg}</p> : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando perfil…</p>
      ) : !perfil ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="font-medium text-foreground">Sin perfil profesional</p>
          <Button className="mt-4" render={<Link href="/registro-profesional" />}>
            Crear registro
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          <section className="text-sm text-muted-foreground">
            <p>
              <span className="text-foreground">Estado:</span>{" "}
              {perfil.estado_label ?? perfil.estado ?? "—"}
            </p>
            <p>
              <span className="text-foreground">Área:</span>{" "}
              {perfil.area_label ?? perfil.area ?? "—"}
            </p>
            <p>
              <span className="text-foreground">Nombre público:</span> {perfil.nombre}
            </p>
            {perfil.documentos && perfil.documentos.length > 0 ? (
              <div className="mt-3 space-y-1">
                <p className="text-foreground">Certificados enviados:</p>
                <ul className="list-inside list-disc">
                  {perfil.documentos.map((d) => (
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
              </div>
            ) : null}
          </section>

          <form onSubmit={(e) => void onSave(e)} className="space-y-5">
            <h2 className="font-serif text-xl text-foreground">Editar datos</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="pro-titulo">Título profesional</Label>
                <Input
                  id="pro-titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <PhoneInput
                  id="pro-cel"
                  label="Celular"
                  value={celular}
                  onChange={setCelular}
                  optional
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pro-mod">Modalidad</Label>
                <Select
                  value={modalidad}
                  onValueChange={(v) => setModalidad(v || "presencial")}
                  items={MODALIDADES}
                >
                  <SelectTrigger id="pro-mod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODALIDADES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="pro-disp">Disponibilidad</Label>
                <Input
                  id="pro-disp"
                  value={disponibilidad}
                  onChange={(e) => setDisponibilidad(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="pro-desc">Descripción</Label>
                <Textarea
                  id="pro-desc"
                  rows={4}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : "Guardar cambios"}
            </Button>
          </form>

          <section>
            <h2 className="mb-4 font-serif text-xl text-foreground">
              Solicitudes de contacto
            </h2>
            {solicitudes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Cuando alguien te contacte desde Manos profesionales, aparecerá aquí.
              </p>
            ) : (
              <ul className="space-y-3">
                {solicitudes.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-xl border border-border bg-card px-4 py-3 text-sm"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <p className="font-medium text-foreground">{s.nombre}</p>
                      <span className="text-muted-foreground">
                        {s.estado ?? "pendiente"}
                        {s.created_at
                          ? ` · ${new Date(s.created_at).toLocaleString("es-CO")}`
                          : ""}
                      </span>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {s.preferencia_contacto ?? "contacto"}: {s.celular}
                      {s.email ? ` · ${s.email}` : ""}
                    </p>
                    <p className="mt-2 text-foreground/90">{s.mensaje}</p>
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
