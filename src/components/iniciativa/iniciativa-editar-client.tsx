"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { AportanteRow } from "@/components/aportes/aportante-row"
import { AvancesEditorPanel } from "@/components/iniciativa/avances-editor-panel"
import { PortadaCrop } from "@/components/iniciativa/portada-crop"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DepartamentoMunicipioSelect } from "@/components/ui/departamento-municipio-select"
import { HorarioSemanaGrid } from "@/components/ui/horario-semana-grid"
import { PhoneInput } from "@/components/ui/phone-input"
import { useRequireRoleTree } from "@/hooks/use-require-role-tree"
import { ApiError } from "@/lib/api"
import {
  cerrarIniciativa,
  deleteIniciativaGaleria,
  fetchAportantes,
  fetchCatalogos,
  fetchIniciativaApi,
  eliminarEvidenciaAporte,
  marcarAporteRecepcion,
  updateIniciativa,
  uploadIniciativaGaleria,
  uploadIniciativaPortada,
} from "@/lib/convites-api"
import { isImageFile, resizeImageFile } from "@/lib/image-resize"
import {
  isVideoFile,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_SECONDS,
  videoDurationSeconds,
} from "@/lib/video-upload"
import type { ApiAporte, ApiCategoria, ApiIniciativa } from "@/lib/types"
import {
  perfilTabsForRole,
  resolvePrimaryRole,
  type RoleTree,
} from "@/lib/role-tree"
import { useAdminPerfilTabs } from "@/components/admin/use-admin-perfil-tabs"
import { ITEM_UNIDAD_OPTIONS, ITEM_UNIDAD_VALUES } from "@/lib/item-unidades"
import { ImagePlus, Link2, Plus, Trash2, Video } from "lucide-react"

const URGENCIAS = [
  { value: "alta", label: "Urgencia alta" },
  { value: "media", label: "Urgencia media" },
  { value: "baja", label: "Sin prisa" },
] as const

type EditTab =
  | "sobre"
  | "ubicacion"
  | "proveedores"
  | "items"
  | "multimedia"
  | "avances"
  | "verificacion"
  | "aportantes"

type ItemDraft = {
  key: string
  nombre: string
  unidad: string
  cantidad: string
  descripcion?: string
  valorUnitario?: string
}

type EnlaceDraft = {
  key: string
  titulo: string
  url: string
}

type GaleriaDraft = {
  id: number
  tipo: "imagen" | "video"
  url: string
  duracionSegundos?: number | null
}

type PuntoDraft = {
  id: string
  departamentoId: string
  municipioId: string
  municipioNombre: string
  nombre: string
  direccion: string
  horario: string
  contacto: string
}

type ProveedorDraft = {
  key: string
  nombre: string
  direccion: string
  ciudad: string
  correo: string
  celular: string
  instruccionesPago: string
}

function toDateInput(value: string | null | undefined): string {
  if (!value) return ""
  return value.slice(0, 10)
}

export function IniciativaEditarClient({
  allowedRoles = ["aportante"],
  backHref = "/panel/creador",
  pathPrefix = "/panel/creador",
  /** Admin usa /admin/convites/[slug] sin /editar. */
  useEditarSuffix = true,
}: {
  allowedRoles?: RoleTree[]
  backHref?: string
  pathPrefix?: string
  useEditarSuffix?: boolean
}) {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const router = useRouter()
  const routePath = useEditarSuffix
    ? `${pathPrefix}/${slug}/editar`
    : `${pathPrefix}/${slug}`
  const { user, token, loading: authLoading, hasPermission } = useRequireRoleTree(
    routePath,
    allowedRoles,
  )
  const primaryRole = resolvePrimaryRole(user)
  const adminTabs = useAdminPerfilTabs(
    user,
    primaryRole === "admin" ? token : null,
    routePath,
  )

  const [section, setSection] = useState<EditTab>("sobre")
  const [detalle, setDetalle] = useState<ApiIniciativa | null>(null)
  const [categorias, setCategorias] = useState<ApiCategoria[]>([])
  const [aportes, setAportes] = useState<ApiAporte[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [closing, setClosing] = useState(false)
  const [recepcionId, setRecepcionId] = useState<number | null>(null)
  const [mediaBusy, setMediaBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedOk, setSavedOk] = useState(false)

  const [titulo, setTitulo] = useState("")
  const [resumen, setResumen] = useState("")
  const [historia, setHistoria] = useState("")
  const [urgencia, setUrgencia] = useState<"alta" | "media" | "baja">("media")
  const [categoriaId, setCategoriaId] = useState("")
  const [departamentoId, setDepartamentoId] = useState("")
  const [municipioId, setMunicipioId] = useState("")
  const [lugarConvite, setLugarConvite] = useState("")
  const [lugarExacto, setLugarExacto] = useState("")
  const [fechaConvite, setFechaConvite] = useState("")
  const [fechaLimite, setFechaLimite] = useState("")
  const [puntosAcopio, setPuntosAcopio] = useState<PuntoDraft[]>([])
  const [proveedores, setProveedores] = useState<ProveedorDraft[]>([])
  const [items, setItems] = useState<ItemDraft[]>([])
  const [portadaUrl, setPortadaUrl] = useState<string | null>(null)
  const [galeria, setGaleria] = useState<GaleriaDraft[]>([])
  const [enlaces, setEnlaces] = useState<EnlaceDraft[]>([])
  const [responsable, setResponsable] = useState("")
  const [respaldo, setRespaldo] = useState("")
  const [contacto, setContacto] = useState("")
  const [version, setVersion] = useState(1)

  const load = useCallback(async () => {
    if (!token || !slug) return
    setLoading(true)
    setError(null)
    try {
      const [d, cats] = await Promise.all([
        fetchIniciativaApi(slug, token),
        fetchCatalogos(false),
      ])
      setDetalle(d)
      setCategorias(cats.categorias)
      setTitulo(d.titulo ?? "")
      setResumen(d.resumen ?? "")
      setHistoria((d.historia ?? []).join("\n\n"))
      setUrgencia((d.urgencia as "alta" | "media" | "baja") || "media")
      setCategoriaId(d.categoria?.id ? String(d.categoria.id) : "")
      setDepartamentoId(
        d.municipio?.departamento?.id
          ? String(d.municipio.departamento.id)
          : "",
      )
      setMunicipioId(d.municipio?.id ? String(d.municipio.id) : "")
      setLugarConvite(
        !d.lugar_convite || d.lugar_convite === "Por definir"
          ? ""
          : d.lugar_convite,
      )
      setLugarExacto(d.lugar_exacto ?? d.verificacion?.lugar_exacto ?? "")
      setFechaConvite(toDateInput(d.fecha_convite))
      setFechaLimite(toDateInput(d.fecha_limite_aportes))
      setPuntosAcopio(
        (d.puntos_acopio ?? []).map((p) => ({
          id: String(p.id),
          departamentoId: p.municipio?.departamento
            ? String(p.municipio.departamento.id)
            : "",
          municipioId: p.municipio ? String(p.municipio.id) : "",
          municipioNombre: p.municipio?.nombre ?? "",
          nombre: p.nombre,
          direccion: p.direccion,
          horario: p.horario ?? "",
          contacto: p.contacto ?? "",
        })),
      )
      setProveedores(
        (d.proveedores ?? []).map((p) => ({
          key: String(p.id),
          nombre: p.nombre,
          direccion: p.direccion ?? "",
          ciudad: p.ciudad ?? "",
          correo: p.correo ?? "",
          celular: p.celular ?? "",
          instruccionesPago: p.instrucciones_pago ?? "",
        })),
      )
      setItems(
        (d.items ?? []).length > 0
          ? (d.items ?? []).map((it) => ({
              key: String(it.id),
              nombre: it.nombre,
              unidad: ITEM_UNIDAD_VALUES.includes(
                it.unidad as (typeof ITEM_UNIDAD_VALUES)[number],
              )
                ? it.unidad
                : "unidades",
              cantidad: String(it.cantidad_meta),
              descripcion: it.descripcion ?? "",
              valorUnitario:
                it.valor_unitario_aprox != null
                  ? String(it.valor_unitario_aprox)
                  : "",
            }))
          : [
              {
                key: crypto.randomUUID(),
                nombre: "",
                unidad: "unidades",
                cantidad: "",
                descripcion: "",
                valorUnitario: "",
              },
            ],
      )
      setPortadaUrl(d.imagen_path || null)
      setGaleria(
        (d.galeria ?? []).map((g) => ({
          id: g.id,
          tipo: g.tipo,
          url: g.url,
          duracionSegundos: g.duracion_segundos ?? null,
        })),
      )
      setEnlaces(
        (d.enlaces ?? []).map((e) => ({
          key: String(e.id),
          titulo: e.titulo,
          url: e.url,
        })),
      )
      setResponsable(d.verificacion?.persona_responsable ?? "")
      setRespaldo(d.verificacion?.quien_respalda ?? "")
      setContacto(d.verificacion?.telefono_contacto ?? "")
      setVersion(d.version ?? 1)

      try {
        const list = await fetchAportantes(token, d.id)
        setAportes(list)
      } catch {
        setAportes([])
      }
    } catch (err) {
      setDetalle(null)
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos cargar el convite."
          : "No pudimos cargar el convite.",
      )
    } finally {
      setLoading(false)
    }
  }, [token, slug])

  useEffect(() => {
    if (authLoading || !token) {
      setLoading(false)
      return
    }
    void load()
  }, [authLoading, token, load])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !detalle || saving) return

    const historiaParrafos = historia
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean)
    const historiaPayload =
      historiaParrafos.length > 0 ? historiaParrafos : [resumen.trim()]

    const validItems = items.filter(
      (it) => it.nombre.trim() && it.unidad.trim() && Number(it.cantidad) > 0,
    )
    if (validItems.length === 0) {
      setError("Agrega al menos un ítem con cantidad.")
      setSection("items")
      return
    }

    const incompletePunto = puntosAcopio.find(
      (p) => !p.municipioId || !p.nombre.trim() || !p.direccion.trim(),
    )
    if (incompletePunto) {
      setError(
        "Completa municipio, nombre y dirección de cada punto de acopio, o quítalo.",
      )
      setSection("ubicacion")
      return
    }

    const incompleteProveedor = proveedores.find(
      (p) => !p.nombre.trim() || !p.instruccionesPago.trim(),
    )
    if (incompleteProveedor) {
      setError(
        "Completa nombre e instrucciones de pago de cada proveedor, o quítalo.",
      )
      setSection("proveedores")
      return
    }

    const incompleteLink = enlaces.find(
      (x) =>
        (x.titulo.trim() && !x.url.trim()) ||
        (!x.titulo.trim() && x.url.trim()),
    )
    if (incompleteLink) {
      setError("Completa título y URL de cada enlace, o quítalo.")
      setSection("multimedia")
      return
    }

    setSaving(true)
    setError(null)
    setSavedOk(false)
    try {
      const updated = await updateIniciativa(token, detalle.id, {
        version,
        municipio_id: Number(municipioId),
        categoria_id: Number(categoriaId),
        titulo: titulo.trim(),
        resumen: resumen.trim(),
        historia: historiaPayload,
        urgencia,
        lugar_convite: lugarConvite.trim(),
        lugar_exacto: lugarExacto.trim() || null,
        fecha_convite: fechaConvite || null,
        fecha_limite_aportes: fechaLimite || null,
        fecha_convite_texto: fechaConvite || null,
        persona_responsable: responsable.trim(),
        quien_respalda: respaldo.trim(),
        telefono_contacto: contacto.trim(),
        items: validItems.map((it, idx) => ({
          nombre: it.nombre.trim(),
          unidad: it.unidad.trim(),
          cantidad_meta: Number(it.cantidad),
          orden: idx + 1,
          descripcion: it.descripcion?.trim() || null,
          valor_unitario_aprox:
            it.valorUnitario && !isNaN(Number(it.valorUnitario))
              ? Number(it.valorUnitario)
              : null,
        })),
        puntos_acopio: puntosAcopio
          .filter((p) => p.municipioId && p.nombre.trim() && p.direccion.trim())
          .map((p, idx) => ({
            municipio_id: Number(p.municipioId),
            nombre: p.nombre.trim(),
            direccion: p.direccion.trim(),
            horario: p.horario.trim() || null,
            contacto: p.contacto.trim() || null,
            orden: idx + 1,
          })),
        proveedores: proveedores
          .filter((p) => p.nombre.trim() && p.instruccionesPago.trim())
          .map((p) => ({
            nombre: p.nombre.trim(),
            direccion: p.direccion.trim() || null,
            ciudad: p.ciudad.trim() || null,
            correo: p.correo.trim() || null,
            celular: p.celular.trim() || null,
            instrucciones_pago: p.instruccionesPago.trim(),
          })),
        enlaces: enlaces
          .filter((x) => x.titulo.trim() && x.url.trim())
          .map((x, idx) => ({
            titulo: x.titulo.trim(),
            url: x.url.trim(),
            orden: idx + 1,
          })),
      })
      setDetalle(updated)
      setVersion(updated.version ?? version + 1)
      setSavedOk(true)
      window.setTimeout(() => setSavedOk(false), 2500)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos guardar los cambios."
          : "No pudimos guardar los cambios.",
      )
    } finally {
      setSaving(false)
    }
  }

  async function onCerrar() {
    if (!token || !detalle || closing) return
    const ok = window.confirm(
      `¿Detener «${detalle.titulo}»? Pasará a cerrado y no recibirá más aportes.`,
    )
    if (!ok) return
    setClosing(true)
    setError(null)
    try {
      await cerrarIniciativa(token, detalle.id)
      router.push(backHref)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos cerrar el convite."
          : "No pudimos cerrar el convite.",
      )
    } finally {
      setClosing(false)
    }
  }

  async function onMarcarRecepcion(
    aporte: ApiAporte,
    recibido: boolean,
    evidencia?: File | null,
  ) {
    if (!token || recepcionId) return
    setRecepcionId(aporte.id)
    setError(null)
    try {
      const res = await marcarAporteRecepcion(token, aporte.id, {
        recibido,
        evidencia: evidencia ?? null,
      })
      setAportes((prev) =>
        prev.map((a) => (a.id === aporte.id ? res.data : a)),
      )
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos actualizar el aporte."
          : "No pudimos actualizar el aporte.",
      )
    } finally {
      setRecepcionId(null)
    }
  }

  async function onEliminarEvidencia(aporte: ApiAporte) {
    if (!token || recepcionId) return
    const ok = window.confirm("¿Quitar la evidencia de este aporte?")
    if (!ok) return
    setRecepcionId(aporte.id)
    setError(null)
    try {
      const updated = await eliminarEvidenciaAporte(token, aporte.id)
      setAportes((prev) =>
        prev.map((a) => (a.id === aporte.id ? updated : a)),
      )
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos quitar la evidencia."
          : "No pudimos quitar la evidencia.",
      )
    } finally {
      setRecepcionId(null)
    }
  }

  async function onPortadaCropped(blob: Blob) {
    if (!token || !detalle) return
    setMediaBusy(true)
    setError(null)
    try {
      const updated = await uploadIniciativaPortada(token, detalle.id, blob)
      setDetalle(updated)
      setVersion(updated.version)
      setPortadaUrl(updated.imagen_path)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos subir la portada."
          : "No pudimos subir la portada.",
      )
    } finally {
      setMediaBusy(false)
    }
  }

  async function onGaleriaFiles(files: FileList | null) {
    if (!token || !detalle || !files?.length) return
    setMediaBusy(true)
    setError(null)
    try {
      for (const file of Array.from(files)) {
        if (!isImageFile(file)) {
          setError("La galería solo acepta imágenes.")
          continue
        }
        const resized = await resizeImageFile(file, 2000)
        const uploaded = await uploadIniciativaGaleria(
          token,
          detalle.id,
          resized,
          file.name.replace(/\.\w+$/, "") + ".jpg",
        )
        setVersion(uploaded.version)
        setGaleria((prev) => [
          ...prev,
          { id: uploaded.id, tipo: uploaded.tipo, url: uploaded.url },
        ])
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos subir una foto de la galería."
          : "No pudimos subir una foto de la galería.",
      )
    } finally {
      setMediaBusy(false)
    }
  }

  async function onGaleriaVideoFile(file: File | null) {
    if (!token || !detalle || !file) return
    if (!isVideoFile(file)) {
      setError("Selecciona un archivo de video (mp4, mov o webm).")
      return
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setError("El video no puede superar 100MB.")
      return
    }
    setMediaBusy(true)
    setError(null)
    try {
      const secs = await videoDurationSeconds(file)
      if (secs > MAX_VIDEO_SECONDS) {
        setError("El video no puede durar más de 2 minutos.")
        return
      }
      const uploaded = await uploadIniciativaGaleria(
        token,
        detalle.id,
        file,
        file.name || "video.mp4",
        { duracionSegundos: secs },
      )
      setVersion(uploaded.version)
      setGaleria((prev) => [
        ...prev,
        {
          id: uploaded.id,
          tipo: uploaded.tipo,
          url: uploaded.url,
          duracionSegundos: uploaded.duracion_segundos ?? null,
        },
      ])
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos subir el video."
          : "No pudimos subir el video.",
      )
    } finally {
      setMediaBusy(false)
    }
  }

  async function onRemoveGaleria(galeriaId: number) {
    if (!token || !detalle) return
    setMediaBusy(true)
    setError(null)
    try {
      const updated = await deleteIniciativaGaleria(
        token,
        detalle.id,
        galeriaId,
      )
      setVersion(updated.version)
      setGaleria((prev) => prev.filter((g) => g.id !== galeriaId))
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos quitar la foto."
          : "No pudimos quitar la foto.",
      )
    } finally {
      setMediaBusy(false)
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

  const primary = resolvePrimaryRole(user)
  const shellTabs =
    primary === "admin"
      ? adminTabs
      : primary === "moderador"
        ? perfilTabsForRole(user, routePath)
        : [
            { href: "/panel/aportante", label: "Ayudas" },
            { href: "/panel/creador", label: "Convites", active: true },
            ...(hasPermission("profesional_perfil.view_own")
              ? [{ href: "/panel/profesional", label: "Profesional" }]
              : []),
          ]

  const canSave =
    Boolean(
      titulo.trim() &&
        resumen.trim() &&
        historia.trim() &&
        municipioId &&
        categoriaId &&
        lugarConvite.trim() &&
        responsable.trim() &&
        respaldo.trim() &&
        contacto.trim() &&
        items.some(
          (it) => it.nombre.trim() && it.unidad.trim() && Number(it.cantidad) > 0,
        ),
    )

  return (
    <DashboardShell
      title={detalle ? `Editar: ${detalle.titulo}` : "Editar convite"}
      subtitle="Edita por secciones, como en el asistente de creación."
      tabs={shellTabs}
    >
      <div className="mb-6">
        <Button variant="ghost" render={<Link href={backHref} />}>
          ← Volver
        </Button>
      </div>

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      {!detalle ? (
        <p className="text-sm text-muted-foreground">No encontrado.</p>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-6">
          <Tabs
            value={section}
            onValueChange={(v) => setSection((v as EditTab) || "sobre")}
            className="gap-4"
          >
            <TabsList
              variant="line"
              className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0"
            >
              <TabsTrigger value="sobre" className="px-3 py-2">
                Sobre el convite
              </TabsTrigger>
              <TabsTrigger value="ubicacion" className="px-3 py-2">
                Ubicación
              </TabsTrigger>
              <TabsTrigger value="proveedores" className="px-3 py-2">
                Dónde comprar
              </TabsTrigger>
              <TabsTrigger value="items" className="px-3 py-2">
                Qué se necesita
              </TabsTrigger>
              <TabsTrigger value="multimedia" className="px-3 py-2">
                Multimedia
              </TabsTrigger>
              <TabsTrigger value="avances" className="px-3 py-2">
                Avances
              </TabsTrigger>
              <TabsTrigger value="verificacion" className="px-3 py-2">
                Verificación
              </TabsTrigger>
              <TabsTrigger value="aportantes" className="px-3 py-2">
                Aportantes ({aportes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sobre" className="max-w-2xl space-y-5 pt-2">
              <p className="text-sm text-muted-foreground">
                Título, historia y clasificación del convite.
              </p>
              <div className="space-y-2">
                <Label htmlFor="ce-titulo">Título</Label>
                <Input
                  id="ce-titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                  maxLength={180}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ce-resumen">Resumen breve</Label>
                <Textarea
                  id="ce-resumen"
                  value={resumen}
                  onChange={(e) => setResumen(e.target.value)}
                  required
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ce-historia">La historia</Label>
                <Textarea
                  id="ce-historia"
                  value={historia}
                  onChange={(e) => setHistoria(e.target.value)}
                  required
                  rows={5}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ce-urg">Urgencia</Label>
                  <Select
                    value={urgencia}
                    onValueChange={(v) =>
                      setUrgencia((v as "alta" | "media" | "baja") || "media")
                    }
                    items={[...URGENCIAS]}
                  >
                    <SelectTrigger id="ce-urg" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {URGENCIAS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {u.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ce-cat">Categoría</Label>
                  <Select
                    value={categoriaId}
                    onValueChange={(v) => setCategoriaId(v || "")}
                    items={categorias.map((c) => ({
                      value: String(c.id),
                      label: c.nombre,
                    }))}
                  >
                    <SelectTrigger id="ce-cat" className="w-full">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ubicacion" className="max-w-3xl space-y-5 pt-2">
              <p className="text-sm text-muted-foreground">
                Dónde y cuándo ocurre el convite, y puntos de acopio opcionales
                en otras ciudades.
              </p>
              <DepartamentoMunicipioSelect
                municipioId={municipioId}
                departamentoId={departamentoId}
                onDepartamentoChange={setDepartamentoId}
                onMunicipioChange={(id) => setMunicipioId(id)}
                required
              />
              <div className="space-y-2">
                <Label htmlFor="ce-lugar">Lugar del convite</Label>
                <Input
                  id="ce-lugar"
                  value={lugarConvite}
                  onChange={(e) => setLugarConvite(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ce-lugar-ex">Dirección exacta (opcional)</Label>
                <Input
                  id="ce-lugar-ex"
                  value={lugarExacto}
                  onChange={(e) => setLugarExacto(e.target.value)}
                  placeholder="Solo se comparte con quien confirma aporte"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ce-limite">Fecha límite para aportar</Label>
                  <Input
                    id="ce-limite"
                    type="date"
                    value={fechaLimite}
                    onChange={(e) => setFechaLimite(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ce-fecha">Día de trabajo (opcional)</Label>
                  <Input
                    id="ce-fecha"
                    type="date"
                    value={fechaConvite}
                    onChange={(e) => setFechaConvite(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4 border-t border-border pt-6">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Puntos de acopio en otras ciudades{" "}
                    <span className="font-normal text-muted-foreground">
                      (opcional)
                    </span>
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Si la gente puede dejar ayudas en Bogotá, Medellín u otra
                    ciudad, agrégalas aquí.
                  </p>
                </div>

                {puntosAcopio.map((p, idx) => (
                  <div
                    key={p.id}
                    className="space-y-4 rounded-xl border border-border bg-background p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        Punto {idx + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setPuntosAcopio((prev) =>
                            prev.filter((x) => x.id !== p.id),
                          )
                        }
                        className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                        aria-label={`Quitar punto ${idx + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <DepartamentoMunicipioSelect
                      municipioId={p.municipioId}
                      departamentoId={p.departamentoId}
                      onDepartamentoChange={(id) =>
                        setPuntosAcopio((prev) =>
                          prev.map((x) =>
                            x.id === p.id ? { ...x, departamentoId: id } : x,
                          ),
                        )
                      }
                      onMunicipioChange={(id, nombre) =>
                        setPuntosAcopio((prev) =>
                          prev.map((x) =>
                            x.id === p.id
                              ? {
                                  ...x,
                                  municipioId: id,
                                  municipioNombre: nombre || "",
                                }
                              : x,
                          ),
                        )
                      }
                      incluirInactivos
                      required
                      departamentoLabel="Departamento del punto"
                      municipioLabel="Ciudad / municipio del punto"
                    />
                    <div className="space-y-2">
                      <Label htmlFor={`ce-punto-nombre-${p.id}`}>
                        Nombre del sitio
                      </Label>
                      <Input
                        id={`ce-punto-nombre-${p.id}`}
                        placeholder="Ej: Acopio Bogotá Norte"
                        value={p.nombre}
                        onChange={(e) =>
                          setPuntosAcopio((prev) =>
                            prev.map((x) =>
                              x.id === p.id
                                ? { ...x, nombre: e.target.value }
                                : x,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`ce-punto-dir-${p.id}`}>Dirección</Label>
                      <Input
                        id={`ce-punto-dir-${p.id}`}
                        placeholder="Calle, barrio, referencia"
                        value={p.direccion}
                        onChange={(e) =>
                          setPuntosAcopio((prev) =>
                            prev.map((x) =>
                              x.id === p.id
                                ? { ...x, direccion: e.target.value }
                                : x,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="space-y-4">
                      <HorarioSemanaGrid
                        id={`ce-punto-hor-${p.id}`}
                        label="Horario del punto (opcional)"
                        value={p.horario}
                        onChange={(horario) =>
                          setPuntosAcopio((prev) =>
                            prev.map((x) =>
                              x.id === p.id ? { ...x, horario } : x,
                            ),
                          )
                        }
                      />
                      <div className="space-y-2">
                        <Label htmlFor={`ce-punto-cel-${p.id}`}>
                          Contacto (opcional)
                        </Label>
                        <Input
                          id={`ce-punto-cel-${p.id}`}
                          placeholder="Celular o nombre"
                          value={p.contacto}
                          onChange={(e) =>
                            setPuntosAcopio((prev) =>
                              prev.map((x) =>
                                x.id === p.id
                                  ? { ...x, contacto: e.target.value }
                                  : x,
                              ),
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {puntosAcopio.length < 20 ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() =>
                      setPuntosAcopio((prev) => [
                        ...prev,
                        {
                          id: crypto.randomUUID(),
                          departamentoId: "",
                          municipioId: "",
                          municipioNombre: "",
                          nombre: "",
                          direccion: "",
                          horario: "",
                          contacto: "",
                        },
                      ])
                    }
                  >
                    <Plus className="h-4 w-4" />
                    Agregar punto de acopio
                  </Button>
                ) : null}
              </div>
            </TabsContent>

            <TabsContent
              value="proveedores"
              className="max-w-3xl space-y-5 pt-2"
            >
              <p className="text-sm text-muted-foreground">
                Proveedores donde la gente puede comprar directamente los
                ítems solicitados y enviarlos o pagarlos.
              </p>

              <div className="space-y-4">
                {proveedores.map((p, idx) => (
                  <div
                    key={p.key}
                    className="space-y-4 rounded-xl border border-border bg-background p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        Proveedor {idx + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setProveedores((prev) =>
                            prev.filter((x) => x.key !== p.key),
                          )
                        }
                        className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                        aria-label={`Quitar proveedor ${idx + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`ce-prov-nombre-${p.key}`}>
                          Nombre
                        </Label>
                        <Input
                          id={`ce-prov-nombre-${p.key}`}
                          placeholder="Ej: Ferretería El Tornillo"
                          value={p.nombre}
                          onChange={(e) =>
                            setProveedores((prev) =>
                              prev.map((x) =>
                                x.key === p.key
                                  ? { ...x, nombre: e.target.value }
                                  : x,
                              ),
                            )
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`ce-prov-dir-${p.key}`}>
                          Dirección (opcional)
                        </Label>
                        <Input
                          id={`ce-prov-dir-${p.key}`}
                          placeholder="Calle, barrio, referencia"
                          value={p.direccion}
                          onChange={(e) =>
                            setProveedores((prev) =>
                              prev.map((x) =>
                                x.key === p.key
                                  ? { ...x, direccion: e.target.value }
                                  : x,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`ce-prov-ciudad-${p.key}`}>
                          Ciudad (opcional)
                        </Label>
                        <Input
                          id={`ce-prov-ciudad-${p.key}`}
                          placeholder="Ej: Bogotá"
                          value={p.ciudad}
                          onChange={(e) =>
                            setProveedores((prev) =>
                              prev.map((x) =>
                                x.key === p.key
                                  ? { ...x, ciudad: e.target.value }
                                  : x,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`ce-prov-correo-${p.key}`}>
                          Correo (opcional)
                        </Label>
                        <Input
                          id={`ce-prov-correo-${p.key}`}
                          type="email"
                          placeholder="contacto@proveedor.com"
                          value={p.correo}
                          onChange={(e) =>
                            setProveedores((prev) =>
                              prev.map((x) =>
                                x.key === p.key
                                  ? { ...x, correo: e.target.value }
                                  : x,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`ce-prov-cel-${p.key}`}>
                          Celular (opcional)
                        </Label>
                        <Input
                          id={`ce-prov-cel-${p.key}`}
                          placeholder="Ej: 3001234567"
                          value={p.celular}
                          onChange={(e) =>
                            setProveedores((prev) =>
                              prev.map((x) =>
                                x.key === p.key
                                  ? { ...x, celular: e.target.value }
                                  : x,
                              ),
                            )
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`ce-prov-pago-${p.key}`}>
                        Instrucciones de pago
                      </Label>
                      <Textarea
                        id={`ce-prov-pago-${p.key}`}
                        placeholder="Ej: Cuenta de ahorros Bancolombia 000-000000-00, a nombre de…"
                        value={p.instruccionesPago}
                        onChange={(e) =>
                          setProveedores((prev) =>
                            prev.map((x) =>
                              x.key === p.key
                                ? { ...x, instruccionesPago: e.target.value }
                                : x,
                            ),
                          )
                        }
                        required
                        rows={3}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {proveedores.length < 20 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    setProveedores((prev) => [
                      ...prev,
                      {
                        key: crypto.randomUUID(),
                        nombre: "",
                        direccion: "",
                        ciudad: "",
                        correo: "",
                        celular: "",
                        instruccionesPago: "",
                      },
                    ])
                  }
                >
                  <Plus className="h-4 w-4" />
                  Agregar proveedor
                </Button>
              ) : null}
            </TabsContent>

            <TabsContent value="items" className="max-w-3xl space-y-5 pt-2">
              <p className="text-sm text-muted-foreground">
                Lo que se necesita en especie o en trabajo. Cada persona podrá
                reservar unidades concretas.
              </p>
              <div className="space-y-4">
                {items.map((it) => (
                  <div
                    key={it.key}
                    className="space-y-3 rounded-lg border border-border bg-card p-4"
                  >
                  <div className="grid gap-3 sm:grid-cols-[1fr_140px_160px_auto] sm:items-end">
                    <div className="space-y-2">
                      <Label htmlFor={`ce-item-n-${it.key}`}>
                        ¿Qué se necesita?
                      </Label>
                      <Input
                        id={`ce-item-n-${it.key}`}
                        value={it.nombre}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((x) =>
                              x.key === it.key
                                ? { ...x, nombre: e.target.value }
                                : x,
                            ),
                          )
                        }
                        placeholder="Ej: Tejas de zinc"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`ce-item-c-${it.key}`}>
                        ¿Cuántas unidades?
                      </Label>
                      <Input
                        id={`ce-item-c-${it.key}`}
                        type="number"
                        min={1}
                        value={it.cantidad}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((x) =>
                              x.key === it.key
                                ? { ...x, cantidad: e.target.value }
                                : x,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`ce-item-u-${it.key}`}>¿Tipo?</Label>
                      <Select
                        value={it.unidad || "unidades"}
                        onValueChange={(v) =>
                          setItems((prev) =>
                            prev.map((x) =>
                              x.key === it.key
                                ? { ...x, unidad: v ?? "unidades" }
                                : x,
                            ),
                          )
                        }
                        items={ITEM_UNIDAD_OPTIONS.map((o) => ({
                          value: o.value,
                          label: o.label,
                        }))}
                      >
                        <SelectTrigger
                          id={`ce-item-u-${it.key}`}
                          className="mb-0 h-8 w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ITEM_UNIDAD_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Eliminar ítem"
                      disabled={items.length === 1}
                      onClick={() =>
                        setItems((prev) =>
                          prev.length > 1
                            ? prev.filter((x) => x.key !== it.key)
                            : prev,
                        )
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`ce-item-d-${it.key}`}>
                      Instrucciones o detalle (opcional)
                    </Label>
                    <Textarea
                      id={`ce-item-d-${it.key}`}
                      value={it.descripcion ?? ""}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((x) =>
                            x.key === it.key
                              ? { ...x, descripcion: e.target.value }
                              : x,
                          ),
                        )
                      }
                      placeholder="Ej: marca específica, dónde conseguirlo, empaque preferido…"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2 sm:max-w-xs">
                    <Label htmlFor={`ce-item-v-${it.key}`}>
                      Valor aproximado por unidad, en COP (opcional)
                    </Label>
                    <Input
                      id={`ce-item-v-${it.key}`}
                      type="number"
                      min="0"
                      step="1000"
                      value={it.valorUnitario ?? ""}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((x) =>
                            x.key === it.key
                              ? { ...x, valorUnitario: e.target.value }
                              : x,
                          ),
                        )
                      }
                      placeholder="Ej: 15000"
                    />
                  </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() =>
                  setItems((prev) => [
                    ...prev,
                    {
                      key: crypto.randomUUID(),
                      nombre: "",
                      unidad: "unidades",
                      cantidad: "",
                      descripcion: "",
                      valorUnitario: "",
                    },
                  ])
                }
              >
                <Plus className="h-4 w-4" /> Agregar otro ítem
              </Button>
            </TabsContent>

            <TabsContent value="multimedia" className="max-w-2xl space-y-8 pt-2">
              <PortadaCrop
                previewUrl={portadaUrl}
                onCropped={onPortadaCropped}
                onClear={() => setPortadaUrl(null)}
                busy={mediaBusy}
              />

              <div className="space-y-3 border-t border-border pt-6">
                <Label>Galería multimedia</Label>
                <p className="text-sm text-muted-foreground">
                  Fotos: máximo 2000×2000 px, sin deformar. Videos: máximo 2
                  minutos y 100MB. Hasta 12 archivos en total.
                </p>
                {galeria.length > 0 ? (
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {galeria.map((g) => (
                      <li
                        key={g.id}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                      >
                        {g.tipo === "video" ? (
                          <video
                            src={g.url}
                            className="h-full w-full object-cover"
                            muted
                            playsInline
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={g.url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                        <button
                          type="button"
                          className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-muted-foreground opacity-0 shadow transition-opacity group-hover:opacity-100 hover:text-destructive"
                          aria-label={g.tipo === "video" ? "Quitar video" : "Quitar foto"}
                          disabled={mediaBusy}
                          onClick={() => void onRemoveGaleria(g.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {galeria.length < 12 ? (
                  <div className="flex flex-wrap gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                      <ImagePlus className="h-4 w-4 text-primary" />
                      {mediaBusy ? "Subiendo…" : "Agregar fotos"}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        disabled={mediaBusy}
                        onChange={(e) => {
                          void onGaleriaFiles(e.target.files)
                          e.target.value = ""
                        }}
                      />
                    </label>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                      <Video className="h-4 w-4 text-primary" />
                      {mediaBusy ? "Subiendo…" : "Agregar video"}
                      <input
                        type="file"
                        accept="video/*"
                        className="sr-only"
                        disabled={mediaBusy}
                        onChange={(e) => {
                          void onGaleriaVideoFile(e.target.files?.[0] ?? null)
                          e.target.value = ""
                        }}
                      />
                    </label>
                  </div>
                ) : null}
              </div>

              <div className="space-y-4 border-t border-border pt-6">
                <div>
                  <Label className="inline-flex items-center gap-2">
                    <Link2 className="h-4 w-4" /> Enlaces externos
                  </Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Opcional. Noticias, redes o páginas relacionadas.
                  </p>
                </div>
                {enlaces.map((enlace) => (
                  <div
                    key={enlace.key}
                    className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end"
                  >
                    <div className="space-y-2">
                      <Label htmlFor={`ce-en-t-${enlace.key}`}>Título</Label>
                      <Input
                        id={`ce-en-t-${enlace.key}`}
                        value={enlace.titulo}
                        onChange={(e) =>
                          setEnlaces((prev) =>
                            prev.map((x) =>
                              x.key === enlace.key
                                ? { ...x, titulo: e.target.value }
                                : x,
                            ),
                          )
                        }
                        placeholder="Ej: Nota en El Tiempo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`ce-en-u-${enlace.key}`}>URL</Label>
                      <Input
                        id={`ce-en-u-${enlace.key}`}
                        type="url"
                        value={enlace.url}
                        onChange={(e) =>
                          setEnlaces((prev) =>
                            prev.map((x) =>
                              x.key === enlace.key
                                ? { ...x, url: e.target.value }
                                : x,
                            ),
                          )
                        }
                        placeholder="https://"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Eliminar enlace"
                      onClick={() =>
                        setEnlaces((prev) =>
                          prev.filter((x) => x.key !== enlace.key),
                        )
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {enlaces.length < 20 ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() =>
                      setEnlaces((prev) => [
                        ...prev,
                        { key: crypto.randomUUID(), titulo: "", url: "" },
                      ])
                    }
                  >
                    <Plus className="h-4 w-4" /> Agregar enlace
                  </Button>
                ) : null}
              </div>
            </TabsContent>

            <TabsContent value="avances" className="pt-2">
              {token && detalle ? (
                <AvancesEditorPanel
                  token={token}
                  iniciativaUuid={detalle.uuid}
                  items={detalle.items ?? []}
                />
              ) : null}
            </TabsContent>

            <TabsContent
              value="verificacion"
              className="max-w-2xl space-y-5 pt-2"
            >
              <p className="text-sm text-muted-foreground">
                Estos datos solo los ve el equipo de moderación. No se publican.
              </p>
              <div className="space-y-2">
                <Label htmlFor="ce-resp">Persona responsable</Label>
                <Input
                  id="ce-resp"
                  value={responsable}
                  onChange={(e) => setResponsable(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ce-respaldo">Quién respalda</Label>
                <Input
                  id="ce-respaldo"
                  value={respaldo}
                  onChange={(e) => setRespaldo(e.target.value)}
                  required
                />
              </div>
              <PhoneInput
                id="ce-tel"
                label="Teléfono de contacto"
                value={contacto}
                onChange={setContacto}
                required
              />
            </TabsContent>

            <TabsContent value="aportantes" className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Compromisos de aporte y su estado (confirmado, cumplido,
                cancelado). Puedes marcar recepción y gestionar evidencias.
              </p>
              {aportes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aún no hay aportantes en este convite.
                </p>
              ) : (
                <ul className="space-y-3">
                  {aportes.map((a) => (
                    <AportanteRow
                      key={a.id}
                      aporte={a}
                      busy={recepcionId === a.id}
                      onRecibido={(file) =>
                        void onMarcarRecepcion(a, true, file)
                      }
                      onNoRecibido={() => void onMarcarRecepcion(a, false)}
                      onEliminarEvidencia={() => void onEliminarEvidencia(a)}
                    />
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>

          {section !== "aportantes" && section !== "avances" ? (
            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
              <Button
                type="submit"
                disabled={saving || closing || mediaBusy || !canSave}
              >
                {saving ? "Guardando…" : "Guardar cambios"}
              </Button>
              {savedOk ? (
                <span className="text-sm text-emerald-700">Guardado</span>
              ) : null}
              {(detalle.estado === "publicada" ||
                detalle.estado === "en_curso") && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving || closing}
                  onClick={() => void onCerrar()}
                >
                  {closing ? "Cerrando…" : "Detener convite"}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                render={<Link href={backHref} />}
              >
                Cancelar
              </Button>
              <span className="text-xs text-muted-foreground">
                Versión {version}
              </span>
            </div>
          ) : null}
        </form>
      )}
    </DashboardShell>
  )
}
