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
  deleteMiPerfilProfesional,
  fetchMiPerfilProfesional,
  fetchMisSolicitudesProfesional,
  patchSolicitudProfesional,
  updateMiPerfilProfesional,
  type ApiMiPerfilProfesional,
  type ApiProfesionalSolicitud,
  type EstadoSolicitudProfesional,
} from "@/lib/convites-api"
import { canAccessProfesionalPanel, perfilTabsForRole } from "@/lib/role-tree"
import { PhoneInput, isPhoneValid } from "@/components/ui/phone-input"

const MODALIDADES = [
  { value: "presencial", label: "Presencial" },
  { value: "virtual", label: "Virtual" },
  { value: "presencial_y_virtual", label: "Presencial y virtual" },
]

const ESTADOS_SOLICITUD: { value: EstadoSolicitudProfesional; label: string }[] =
  [
    { value: "pendiente", label: "Pendiente" },
    { value: "notificada", label: "Notificada" },
    { value: "atendida", label: "Atendida" },
    { value: "negada", label: "Negada" },
    { value: "trasladada", label: "Trasladada" },
    { value: "no_contesta", label: "No contesta" },
    { value: "spam", label: "Spam" },
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
  const [busySolicitudId, setBusySolicitudId] = useState<number | null>(null)
  const [notaDraft, setNotaDraft] = useState<Record<number, string>>({})
  const [tab, setTab] = useState<"perfil" | "solicitudes">("perfil")

  const [titulo, setTitulo] = useState("")
  const [celular, setCelular] = useState("")
  const [modalidad, setModalidad] = useState("presencial")
  const [disponibilidad, setDisponibilidad] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [visibleEnDirectorio, setVisibleEnDirectorio] = useState(true)
  const [deleting, setDeleting] = useState(false)

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
      setVisibleEnDirectorio(p.visible_en_directorio !== false)
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
        visible_en_directorio: visibleEnDirectorio,
      })
      setPerfil(updated)
      setVisibleEnDirectorio(updated.visible_en_directorio !== false)
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

  async function onToggleVisible(next: boolean) {
    if (!token || saving) return
    setSaving(true)
    setError(null)
    setSavedMsg(null)
    const prev = visibleEnDirectorio
    setVisibleEnDirectorio(next)
    try {
      const updated = await updateMiPerfilProfesional(token, {
        visible_en_directorio: next,
      })
      setPerfil(updated)
      setVisibleEnDirectorio(updated.visible_en_directorio !== false)
      setSavedMsg(
        next
          ? "Tu perfil ya es visible en Manos profesionales."
          : "Tu perfil quedó oculto del directorio.",
      )
    } catch (err) {
      setVisibleEnDirectorio(prev)
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos actualizar la visibilidad."
          : "No pudimos actualizar la visibilidad.",
      )
    } finally {
      setSaving(false)
    }
  }

  async function onEliminarPerfil() {
    if (!token || deleting) return
    const ok = window.confirm(
      "¿Eliminar tu perfil profesional del directorio?\n\nTu cuenta de Convites se mantiene. Solo se quita el perfil público de Manos profesionales. Podrás registrar uno nuevo después.",
    )
    if (!ok) return
    setDeleting(true)
    setError(null)
    try {
      await deleteMiPerfilProfesional(token)
      setPerfil(null)
      setSolicitudes([])
      setSavedMsg(null)
      setError(null)
      window.location.assign("/panel")
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos eliminar el perfil."
          : "No pudimos eliminar el perfil.",
      )
      setDeleting(false)
    }
  }

  async function onPatchSolicitud(
    s: ApiProfesionalSolicitud,
    patch: { estado?: EstadoSolicitudProfesional; nota?: string },
  ) {
    if (!token || busySolicitudId) return
    setBusySolicitudId(s.id)
    setError(null)
    try {
      const updated = await patchSolicitudProfesional(token, s.id, patch)
      setSolicitudes((prev) =>
        prev.map((row) => (row.id === s.id ? updated : row)),
      )
      if (patch.nota) {
        setNotaDraft((prev) => ({ ...prev, [s.id]: "" }))
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos actualizar la solicitud."
          : "No pudimos actualizar la solicitud.",
      )
    } finally {
      setBusySolicitudId(null)
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
          Este panel se activa cuando un moderador aprueba tu perfil profesional.
          Si ya enviaste el formulario, tu solicitud está en revisión.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Button render={<Link href="/panel/roles/profesional" />}>
            Ver estado de la solicitud
          </Button>
          <Button
            variant="outline"
            render={<Link href="/panel/roles/profesional/registro" />}
          >
            Enviar / completar registro
          </Button>
        </div>
      </div>
    )
  }

  const tabs = perfilTabsForRole(user, "/panel/profesional")

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
          <Button className="mt-4" render={<Link href="/panel/roles/profesional/registro" />}>
            Crear registro
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex gap-1 rounded-lg border border-border p-1 w-fit">
            <Button
              type="button"
              size="sm"
              variant={tab === "perfil" ? "default" : "ghost"}
              onClick={() => setTab("perfil")}
            >
              Perfil
            </Button>
            <Button
              type="button"
              size="sm"
              variant={tab === "solicitudes" ? "default" : "ghost"}
              onClick={() => setTab("solicitudes")}
            >
              Solicitudes ({solicitudes.length})
            </Button>
          </div>

          {tab === "solicitudes" ? (
          <section>
            <h2 className="mb-4 font-serif text-xl text-foreground">
              Solicitudes de contacto
            </h2>
            {solicitudes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Cuando alguien te contacte desde Manos profesionales, aparecerá aquí.
              </p>
            ) : (
              <ul className="space-y-4">
                {solicitudes.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-xl border border-border bg-card px-4 py-4 text-sm"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <p className="font-medium text-foreground">{s.nombre}</p>
                      <span className="text-muted-foreground">
                        {s.estado_label ?? s.estado ?? "pendiente"}
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
                    {s.nota ? (
                      <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                        {s.nota}
                      </pre>
                    ) : null}
                    <div className="mt-4 grid gap-3 sm:grid-cols-[12rem_1fr_auto]">
                      <div className="space-y-1">
                        <Label htmlFor={`est-${s.id}`}>Estado</Label>
                        <Select
                          value={s.estado ?? "pendiente"}
                          onValueChange={(v) => {
                            if (!v || busySolicitudId === s.id) return
                            void onPatchSolicitud(s, {
                              estado: v as EstadoSolicitudProfesional,
                            })
                          }}
                          items={ESTADOS_SOLICITUD}
                        >
                          <SelectTrigger id={`est-${s.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ESTADOS_SOLICITUD.map((e) => (
                              <SelectItem key={e.value} value={e.value}>
                                {e.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`nota-${s.id}`}>Agregar nota</Label>
                        <Textarea
                          id={`nota-${s.id}`}
                          rows={2}
                          value={notaDraft[s.id] ?? ""}
                          onChange={(e) =>
                            setNotaDraft((prev) => ({
                              ...prev,
                              [s.id]: e.target.value,
                            }))
                          }
                          placeholder="Se acumula con fecha en el historial"
                          disabled={busySolicitudId === s.id}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          size="sm"
                          disabled={
                            busySolicitudId === s.id ||
                            !(notaDraft[s.id]?.trim())
                          }
                          onClick={() =>
                            void onPatchSolicitud(s, {
                              nota: notaDraft[s.id]?.trim(),
                            })
                          }
                        >
                          {busySolicitudId === s.id ? "…" : "Guardar nota"}
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
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

          <section className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <h2 className="font-serif text-xl text-foreground">
              Visibilidad en el directorio
            </h2>
            <p className="text-sm text-muted-foreground">
              Si lo ocultas, tu perfil aprobado deja de aparecer en Manos
              profesionales. Tu cuenta sigue activa y puedes volver a mostrarlo
              cuando quieras.
            </p>
            <label className="flex cursor-pointer items-center gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={visibleEnDirectorio}
                disabled={saving || deleting || perfil.estado !== "aprobado"}
                onChange={(e) => void onToggleVisible(e.target.checked)}
              />
              Visible en Manos profesionales
            </label>
            {perfil.estado !== "aprobado" ? (
              <p className="text-xs text-muted-foreground">
                La visibilidad pública aplica cuando el perfil esté aprobado.
              </p>
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
            <Button type="submit" disabled={saving || deleting}>
              {saving ? "Guardando…" : "Guardar cambios"}
            </Button>
          </form>

          <section className="space-y-3 border-t border-border pt-8">
            <h2 className="font-serif text-xl text-foreground">
              Eliminar perfil profesional
            </h2>
            <p className="text-sm text-muted-foreground">
              Quita tu perfil del directorio y de Manos profesionales. No elimina
              tu cuenta de Convites; solo este perfil público.
            </p>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting || saving}
              onClick={() => void onEliminarPerfil()}
            >
              {deleting ? "Eliminando…" : "Eliminar mi perfil profesional"}
            </Button>
          </section>
        </div>
          )}
        </div>
      )}
    </DashboardShell>
  )
}
