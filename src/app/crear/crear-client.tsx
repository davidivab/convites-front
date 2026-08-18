"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { ExternalMoneyCallout } from "@/components/iniciativa/external-money-callout"
import { DepartamentoMunicipioSelect } from "@/components/ui/departamento-municipio-select"
import { PhoneInput, isPhoneValid } from "@/components/ui/phone-input"
import { HorarioSemanaGrid } from "@/components/ui/horario-semana-grid"
import { ApiError } from "@/lib/api"
import {
  createIniciativa,
  deleteIniciativaGaleria,
  enviarRevision,
  fetchCatalogos,
  fetchIniciativaApi,
  updateIniciativa,
  uploadIniciativaGaleria,
  uploadIniciativaPortada,
} from "@/lib/convites-api"
import { isImageFile, resizeImageFile } from "@/lib/image-resize"
import { ITEM_UNIDAD_OPTIONS, ITEM_UNIDAD_VALUES } from "@/lib/item-unidades"
import type { ApiCategoria, ApiIniciativa } from "@/lib/types"
import {
  CREAR_STEP_SCHEMAS,
  crearFormSchema,
  type CrearFormValues,
} from "@/lib/crear-schema"
import { PortadaCrop } from "@/components/iniciativa/portada-crop"
import {
  Check,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Link2,
  ImagePlus,
} from "lucide-react"
import dynamic from "next/dynamic"
import type { MapLocation } from "@/components/map/location-picker"

const LocationPicker = dynamic(
  () => import("@/components/map/location-picker").then((m) => m.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-border bg-muted/40 text-sm text-muted-foreground">
        Cargando mapa…
      </div>
    ),
  },
)

type NeededItem = {
  id: string
  name: string
  unit: string
  quantity: string
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

type EnlaceDraft = {
  id: string
  titulo: string
  url: string
}

type GaleriaDraft = {
  id: number
  url: string
}

const steps = [
  "Sobre el convite",
  "Ubicación y fechas",
  "Qué se necesita",
  "Multimedia",
  "Verificación",
  "Revisar y publicar",
]

const URGENCIAS = [
  { value: "alta", label: "Urgencia alta" },
  { value: "media", label: "Urgencia media" },
  { value: "baja", label: "Sin prisa" },
] as const

function clampPaso(raw: string | null): number {
  const n = Number(raw)
  if (!Number.isFinite(n)) return 1
  return Math.min(6, Math.max(1, Math.floor(n)))
}

function historiaFromApi(historia: string[] | null | undefined, resumen: string): string {
  const parts = (historia ?? []).map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return ""
  if (parts.length === 1 && parts[0] === resumen.trim()) return ""
  return parts.join("\n\n")
}

export function CrearClient() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl py-16 text-center text-sm text-muted-foreground">
          Cargando…
        </div>
      }
    >
      <CrearClientInner />
    </Suspense>
  )
}

function CrearClientInner() {
  const { token, loading: authLoading } = useRequireAuth("/crear")
  const router = useRouter()
  const searchParams = useSearchParams()
  const slugParam = searchParams.get("slug")
  const pasoParam = searchParams.get("paso")

  const [step, setStep] = useState(() => clampPaso(pasoParam) - 1)
  const [submitting, setSubmitting] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [loadingDraft, setLoadingDraft] = useState(Boolean(slugParam))
  const [error, setError] = useState<string | null>(null)

  const [draftId, setDraftId] = useState<number | null>(null)
  const [draftSlug, setDraftSlug] = useState<string | null>(slugParam)
  const [draftVersion, setDraftVersion] = useState<number | null>(null)
  const draftHydrated = useRef(false)

  const [categorias, setCategorias] = useState<ApiCategoria[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)

  // Form state
  const [title, setTitle] = useState("")
  const [categoriaId, setCategoriaId] = useState("")
  const [urgencia, setUrgencia] = useState<string>("media")
  const [summary, setSummary] = useState("")
  const [story, setStory] = useState("")
  const [zonaId, setZonaId] = useState("")
  const [departamentoId, setDepartamentoId] = useState("")
  const [municipioNombre, setMunicipioNombre] = useState("—")
  const [lugarConvite, setLugarConvite] = useState("")
  const [lugarExacto, setLugarExacto] = useState("")
  const [ubicacion, setUbicacion] = useState<MapLocation | null>(null)
  const [deadline, setDeadline] = useState("")
  const [workday, setWorkday] = useState("")
  const [items, setItems] = useState<NeededItem[]>([
    { id: "1", name: "", unit: "unidades", quantity: "" },
  ])
  const [puntosAcopio, setPuntosAcopio] = useState<PuntoDraft[]>([])
  const [portadaUrl, setPortadaUrl] = useState<string | null>(null)
  const [galeria, setGaleria] = useState<GaleriaDraft[]>([])
  const [enlaces, setEnlaces] = useState<EnlaceDraft[]>([])
  const [mediaBusy, setMediaBusy] = useState(false)
  const [responsable, setResponsable] = useState("")
  const [respaldo, setRespaldo] = useState("")
  const [contacto, setContacto] = useState("")

  // Aceptaciones obligatorias para publicar
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [aceptaDescargo, setAceptaDescargo] = useState(false)

  // RHF + zod: validación de pasos / envío (estado UI sigue en useState)
  const form = useForm<CrearFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- zod 4 + resolver typing
    resolver: zodResolver(crearFormSchema as any),
    mode: "onBlur",
  })
  void form

  function syncUrl(nextStep0: number, slug: string | null) {
    const params = new URLSearchParams()
    params.set("paso", String(nextStep0 + 1))
    if (slug) params.set("slug", slug)
    router.replace(`/crear?${params.toString()}`, { scroll: false })
  }

  function applyDraft(api: ApiIniciativa) {
    setDraftId(api.id)
    setDraftSlug(api.slug)
    setDraftVersion(api.version)
    setTitle(api.titulo ?? "")
    setCategoriaId(api.categoria ? String(api.categoria.id) : "")
    setUrgencia(api.urgencia || "media")
    setSummary(api.resumen ?? "")
    setStory(historiaFromApi(api.historia, api.resumen ?? ""))
    setZonaId(api.municipio ? String(api.municipio.id) : "")
    setDepartamentoId(
      api.municipio?.departamento ? String(api.municipio.departamento.id) : "",
    )
    setMunicipioNombre(api.municipio?.nombre ?? "—")
    setLugarConvite(
      !api.lugar_convite || api.lugar_convite === "Por definir"
        ? ""
        : api.lugar_convite,
    )
    setLugarExacto(api.verificacion?.lugar_exacto || api.lugar_exacto || "")
    if (api.ubicacion?.lat != null && api.ubicacion?.lng != null) {
      setUbicacion({
        lat: api.ubicacion.lat,
        lng: api.ubicacion.lng,
        fuente: "manual",
      })
    } else {
      setUbicacion(null)
    }
    setDeadline(api.fecha_limite_aportes?.slice(0, 10) ?? "")
    setWorkday(api.fecha_convite?.slice(0, 10) ?? "")
    const apiItems = api.items ?? []
    setItems(
      apiItems.length > 0
        ? apiItems.map((it) => ({
            id: String(it.id),
            name: it.nombre,
            unit: ITEM_UNIDAD_VALUES.includes(
              it.unidad as (typeof ITEM_UNIDAD_VALUES)[number],
            )
              ? it.unidad
              : "unidades",
            quantity: String(it.cantidad_meta),
          }))
        : [{ id: "1", name: "", unit: "unidades", quantity: "" }],
    )
    setPuntosAcopio(
      (api.puntos_acopio ?? []).map((p) => ({
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
    setResponsable(api.verificacion?.persona_responsable ?? "")
    setRespaldo(api.verificacion?.quien_respalda ?? "")
    setContacto(api.verificacion?.telefono_contacto ?? "")
    setPortadaUrl(api.imagen_path || null)
    setGaleria(
      (api.galeria ?? []).map((g) => ({
        id: g.id,
        url: g.url,
      })),
    )
    setEnlaces(
      (api.enlaces ?? []).map((e) => ({
        id: String(e.id),
        titulo: e.titulo,
        url: e.url,
      })),
    )
  }

  function snapshot(): CrearFormValues {
    return {
      title,
      categoriaId,
      urgencia: urgencia as "alta" | "media" | "baja",
      summary,
      story,
      zonaId,
      lugarConvite,
      lugarExacto,
      deadline,
      workday,
      items,
      responsable,
      respaldo,
      contacto,
      aceptaTerminos,
      aceptaDescargo,
    }
  }

  function validateStepOrError(): boolean {
    if (step === 3) {
      const incomplete = enlaces.find(
        (e) =>
          (e.titulo.trim() && !e.url.trim()) ||
          (!e.titulo.trim() && e.url.trim()),
      )
      if (incomplete) {
        setError("Completa título y URL de cada enlace, o quítalo.")
        return false
      }
      const badUrl = enlaces.find((e) => {
        if (!e.url.trim()) return false
        try {
          const u = new URL(e.url.trim())
          return u.protocol !== "http:" && u.protocol !== "https:"
        } catch {
          return true
        }
      })
      if (badUrl) {
        setError("Cada enlace debe ser una URL válida (https://…).")
        return false
      }
      setError(null)
      return true
    }
    const schema = CREAR_STEP_SCHEMAS[step] ?? crearFormSchema
    const parsed = schema.safeParse(snapshot())
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa los campos de este paso")
      return false
    }
    setError(null)
    return true
  }

  function buildPayload(wizardPaso: number): Record<string, unknown> {
    const historiaParrafos = story
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean)
    const historia = historiaParrafos.length > 0 ? historiaParrafos : [""]

    const validItems = items.filter(
      (it) => it.name.trim() && it.unit.trim() && Number(it.quantity) > 0,
    )

    return {
      municipio_id: zonaId ? Number(zonaId) : null,
      categoria_id: Number(categoriaId),
      titulo: title.trim(),
      resumen: summary.trim(),
      historia,
      urgencia,
      lugar_convite: lugarConvite.trim() || null,
      lugar_exacto: lugarExacto.trim() || null,
      lat: ubicacion?.lat ?? null,
      lng: ubicacion?.lng ?? null,
      geo_fuente: ubicacion?.fuente ?? null,
      geo_precision: "punto",
      mapa_visible: true,
      fecha_limite_aportes: deadline || null,
      fecha_convite: workday || null,
      fecha_convite_texto: workday || null,
      persona_responsable: responsable.trim() || null,
      quien_respalda: respaldo.trim() || null,
      telefono_contacto: contacto.trim() || null,
      wizard_paso: wizardPaso,
      items: validItems.map((it) => ({
        nombre: it.name.trim(),
        unidad: it.unit.trim(),
        cantidad_meta: Number(it.quantity),
      })),
      puntos_acopio: puntosAcopio
        .filter((p) => p.municipioId && p.nombre.trim() && p.direccion.trim())
        .map((p) => ({
          municipio_id: Number(p.municipioId),
          nombre: p.nombre.trim(),
          direccion: p.direccion.trim(),
          horario: p.horario.trim() || null,
          contacto: p.contacto.trim() || null,
        })),
      enlaces: enlaces
        .filter((e) => e.titulo.trim() && e.url.trim())
        .map((e, i) => ({
          titulo: e.titulo.trim(),
          url: e.url.trim(),
          orden: i + 1,
        })),
    }
  }

  async function persistDraft(
    wizardPaso: number,
  ): Promise<{ ok: boolean; slug: string | null; id: number | null }> {
    if (!token || !categoriaId || !title.trim()) {
      setError("Completa título y categoría para guardar el borrador.")
      return { ok: false, slug: draftSlug, id: draftId }
    }
    setSavingDraft(true)
    setError(null)
    try {
      const payload = buildPayload(wizardPaso)
      if (draftId != null && draftVersion != null) {
        const updated = await updateIniciativa(token, draftId, {
          ...payload,
          version: draftVersion,
        })
        setDraftId(updated.id)
        setDraftSlug(updated.slug)
        setDraftVersion(updated.version)
        return { ok: true, slug: updated.slug, id: updated.id }
      }
      const created = await createIniciativa(token, payload)
      const id = Number(created.id)
      setDraftId(id)
      setDraftSlug(created.slug)
      setDraftVersion(created.version ?? 1)
      return { ok: true, slug: created.slug, id }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos guardar el borrador."
          : "No pudimos guardar el borrador.",
      )
      return { ok: false, slug: draftSlug, id: draftId }
    } finally {
      setSavingDraft(false)
    }
  }

  useEffect(() => {
    if (!pasoParam) {
      syncUrl(step, draftSlug)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasoParam])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await fetchCatalogos(false)
        if (cancelled) return
        setCategorias(data.categorias)
      } catch {
        if (!cancelled) setCategorias([])
      } finally {
        if (!cancelled) setCatalogLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!token || !slugParam || draftHydrated.current) return
    let cancelled = false
    async function loadDraft() {
      setLoadingDraft(true)
      setError(null)
      try {
        const api = await fetchIniciativaApi(slugParam!, token)
        if (cancelled) return
        if (api.estado !== "borrador" && api.estado !== "rechazada") {
          setError("Este convite ya no se puede editar en el asistente.")
          setLoadingDraft(false)
          return
        }
        applyDraft(api)
        draftHydrated.current = true
        const resumePaso = clampPaso(
          pasoParam ?? (api.wizard_paso != null ? String(api.wizard_paso) : "1"),
        )
        setStep(resumePaso - 1)
        syncUrl(resumePaso - 1, api.slug)
      } catch {
        if (!cancelled) {
          setError(
            "No pudimos cargar el borrador. Empieza uno nuevo o vuelve al panel.",
          )
        }
      } finally {
        if (!cancelled) setLoadingDraft(false)
      }
    }
    void loadDraft()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, slugParam])

  function updateItem(id: string, patch: Partial<NeededItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", unit: "unidades", quantity: "" },
    ])
  }

  function removeItem(id: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev))
  }

  const categoriaNombre =
    categorias.find((c) => String(c.id) === categoriaId)?.nombre || "Sin categoría"
  const zonaNombre = municipioNombre

  const canContinue =
    (step === 0 &&
      title.trim() &&
      categoriaId &&
      summary.trim() &&
      story.trim() &&
      urgencia) ||
    (step === 1 && zonaId && lugarConvite.trim()) ||
    (step === 2 &&
      items.some((it) => it.name.trim() && it.unit.trim() && it.quantity)) ||
    step === 3 ||
    (step === 4 &&
      responsable.trim() &&
      respaldo.trim() &&
      isPhoneValid(contacto, true)) ||
    step === 5

  async function ensureDraftId(): Promise<number | null> {
    if (draftId != null) return draftId
    const result = await persistDraft(Math.min(step + 1, 6))
    return result.ok ? result.id : null
  }

  async function onPortadaCropped(blob: Blob) {
    if (!token) return
    setMediaBusy(true)
    setError(null)
    try {
      const id = await ensureDraftId()
      if (id == null) return
      const updated = await uploadIniciativaPortada(token, id, blob)
      setDraftId(updated.id)
      setDraftSlug(updated.slug)
      setDraftVersion(updated.version)
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

  async function onClearPortada() {
    // Portada se limpia en el siguiente guardado dejando imagen; por ahora solo UI.
    // Quitar del servidor requeriría endpoint DELETE; mantenemos la última hasta reemplazar.
    setPortadaUrl(null)
  }

  async function onGaleriaFiles(files: FileList | null) {
    if (!token || !files?.length) return
    setMediaBusy(true)
    setError(null)
    try {
      const id = await ensureDraftId()
      if (id == null) return
      for (const file of Array.from(files)) {
        if (!isImageFile(file)) {
          setError("La galería solo acepta imágenes.")
          continue
        }
        const resized = await resizeImageFile(file, 2000)
        const uploaded = await uploadIniciativaGaleria(
          token,
          id,
          resized,
          file.name.replace(/\.\w+$/, "") + ".jpg",
        )
        setDraftVersion(uploaded.version)
        setGaleria((prev) => [...prev, { id: uploaded.id, url: uploaded.url }])
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

  async function onRemoveGaleria(galeriaId: number) {
    if (!token || draftId == null) return
    setMediaBusy(true)
    setError(null)
    try {
      const updated = await deleteIniciativaGaleria(token, draftId, galeriaId)
      setDraftVersion(updated.version)
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

  async function onContinue() {
    if (!validateStepOrError()) return
    const nextPaso = Math.min(step + 2, 6)
    const result = await persistDraft(nextPaso)
    if (!result.ok) return
    const nextStep0 = step + 1
    setStep(nextStep0)
    syncUrl(nextStep0, result.slug)
  }

  function onBack() {
    const nextStep0 = Math.max(0, step - 1)
    setStep(nextStep0)
    syncUrl(nextStep0, draftSlug)
  }

  async function onEnviarRevision() {
    if (!token || submitting) return

    const parsed = crearFormSchema.safeParse(snapshot())
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa el formulario")
      return
    }

    const incompletePunto = puntosAcopio.find(
      (p) => !p.municipioId || !p.nombre.trim() || !p.direccion.trim(),
    )
    if (incompletePunto) {
      setError(
        "Completa municipio, nombre y dirección de cada punto de acopio, o quítalo.",
      )
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const result = await persistDraft(6)
      if (!result.ok || result.id == null) {
        setSubmitting(false)
        return
      }
      await enviarRevision(token, result.id)
      router.push("/panel/creador")
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos enviar el convite a revisión."
          : "No pudimos enviar el convite a revisión.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || !token || loadingDraft) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center text-sm text-muted-foreground">
        {loadingDraft ? "Cargando borrador…" : "Comprobando sesión…"}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl py-10 md:py-14">
      <div className="mb-8">
        <Link
          href="/panel/creador"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al panel
        </Link>
        <h1 className="text-balance font-serif text-3xl text-foreground md:text-4xl">
          Abre un convite
        </h1>
        <p className="mt-2 max-w-xl text-pretty leading-relaxed text-muted-foreground">
          Cuéntanos qué necesita tu comunidad. Las personas aportan trabajo,
          materiales y tiempo, nunca dinero a través de la plataforma.
        </p>
        {draftSlug ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Borrador guardado · paso {step + 1} de {steps.length}
          </p>
        ) : null}
      </div>

      {/* Stepper */}
      <ol className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-3">
        {steps.map((label, i) => {
          const state = i < step ? "done" : i === step ? "current" : "todo"
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                className={[
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  state === "done" && "bg-primary text-primary-foreground",
                  state === "current" &&
                    "bg-primary/15 text-primary ring-2 ring-primary/40",
                  state === "todo" && "bg-muted text-muted-foreground",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {state === "done" ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={[
                  "text-sm",
                  state === "current"
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                ].join(" ")}
              >
                {label}
              </span>
              {i < steps.length - 1 && (
                <span className="mx-1 hidden h-px w-6 bg-border sm:block" />
              )}
            </li>
          )
        })}
      </ol>

      <div className="rounded-xl border border-border bg-card p-6 md:p-8">
        {step === 0 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Título del convite</Label>
              <Input
                id="title"
                placeholder="Ej: Reconstruir la casa de la familia Quintero"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={categoriaId}
                  onValueChange={(v) => setCategoriaId(v ?? "")}
                  disabled={catalogLoading}
                  items={categorias.map((c) => ({
                    value: String(c.id),
                    label: c.nombre,
                  }))}
                >
                  <SelectTrigger id="category">
                    <SelectValue
                      placeholder={
                        catalogLoading ? "Cargando…" : "Elige una categoría"
                      }
                    />
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
              <div className="space-y-2">
                <Label htmlFor="urgencia">Urgencia</Label>
                <Select
                  value={urgencia}
                  onValueChange={(v) => setUrgencia(v ?? "media")}
                  items={URGENCIAS.map((u) => ({
                    value: u.value,
                    label: u.label,
                  }))}
                >
                  <SelectTrigger id="urgencia">
                    <SelectValue placeholder="Elige urgencia" />
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Resumen breve</Label>
              <Textarea
                id="summary"
                rows={2}
                placeholder="Una o dos frases que expliquen la situación."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="story">La historia</Label>
              <Textarea
                id="story"
                rows={5}
                placeholder="Cuenta con más detalle qué pasó y por qué la comunidad se está uniendo."
                value={story}
                onChange={(e) => setStory(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <DepartamentoMunicipioSelect
              municipioId={zonaId}
              departamentoId={departamentoId}
              onDepartamentoChange={setDepartamentoId}
              onMunicipioChange={(id, nombre) => {
                setZonaId(id)
                setMunicipioNombre(nombre || "—")
              }}
              required
            />
            <div className="space-y-2">
              <Label htmlFor="lugar">Lugar del convite</Label>
              <Input
                id="lugar"
                placeholder="Ej: Salón comunal, vereda El Manzano"
                value={lugarConvite}
                onChange={(e) => setLugarConvite(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lugar-exacto">Dirección exacta (opcional)</Label>
              <Input
                id="lugar-exacto"
                placeholder="Solo se comparte con quien confirma aporte"
                value={lugarExacto}
                onChange={(e) => setLugarExacto(e.target.value)}
              />
            </div>

            <LocationPicker value={ubicacion} onChange={setUbicacion} />

            <div className="space-y-4 border-t border-border pt-6">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Puntos de acopio en otras ciudades{" "}
                  <span className="font-normal text-muted-foreground">
                    (opcional)
                  </span>
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  El convite es para {municipioNombre !== "—" ? municipioNombre : "este municipio"}.
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
                    <Label htmlFor={`punto-nombre-${p.id}`}>
                      Nombre del sitio
                    </Label>
                    <Input
                      id={`punto-nombre-${p.id}`}
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
                    <Label htmlFor={`punto-dir-${p.id}`}>Dirección</Label>
                    <Input
                      id={`punto-dir-${p.id}`}
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
                      id={`punto-hor-${p.id}`}
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
                      <Label htmlFor={`punto-cel-${p.id}`}>
                        Contacto (opcional)
                      </Label>
                      <Input
                        id={`punto-cel-${p.id}`}
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
                  <Plus className="mr-1.5 h-4 w-4" />
                  Agregar punto de acopio
                </Button>
              ) : null}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="deadline">Fecha límite para aportar</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workday">Día de trabajo comunitario (opcional)</Label>
                <Input
                  id="workday"
                  type="date"
                  value={workday}
                  onChange={(e) => setWorkday(e.target.value)}
                />
              </div>
            </div>
            <p className="rounded-lg bg-muted/60 p-4 text-sm leading-relaxed text-muted-foreground">
              La ubicación exacta solo se comparte con las personas que confirman
              su aporte, para cuidar la privacidad de la familia.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Enumera lo que se necesita en especie o en trabajo. Cada persona
                podrá reservar unidades concretas.
              </p>
            </div>
            <div className="space-y-4">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="grid gap-3 rounded-lg border border-border bg-background p-4 sm:grid-cols-[1fr_140px_160px_auto] sm:items-end"
                >
                  <div className="space-y-2">
                    <Label htmlFor={`name-${it.id}`}>¿Qué se necesita?</Label>
                    <Input
                      id={`name-${it.id}`}
                      placeholder="Ej: Tejas de zinc"
                      value={it.name}
                      onChange={(e) => updateItem(it.id, { name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`qty-${it.id}`}>¿Cuántas unidades?</Label>
                    <Input
                      id={`qty-${it.id}`}
                      type="number"
                      min={1}
                      placeholder="40"
                      value={it.quantity}
                      onChange={(e) =>
                        updateItem(it.id, { quantity: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`unit-${it.id}`}>¿Tipo?</Label>
                    <Select
                      value={it.unit || "unidades"}
                      onValueChange={(v) =>
                        updateItem(it.id, { unit: v ?? "unidades" })
                      }
                      items={ITEM_UNIDAD_OPTIONS.map((o) => ({
                        value: o.value,
                        label: o.label,
                      }))}
                    >
                      <SelectTrigger
                        id={`unit-${it.id}`}
                        className="mb-0 h-8 w-full"
                      >
                        <SelectValue placeholder="Elige el tipo" />
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
                    variant="ghost"
                    size="icon"
                    aria-label="Eliminar ítem"
                    onClick={() => removeItem(it.id)}
                    disabled={items.length === 1}
                    className="justify-self-start text-muted-foreground hover:text-destructive sm:justify-self-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={addItem} className="gap-2">
              <Plus className="h-4 w-4" /> Agregar otro ítem
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <PortadaCrop
              previewUrl={portadaUrl}
              onCropped={onPortadaCropped}
              onClear={() => void onClearPortada()}
              busy={mediaBusy}
            />

            <div className="space-y-3 border-t border-border pt-6">
              <Label>Galería de fotos</Label>
              <p className="text-sm text-muted-foreground">
                Puedes subir más fotos. Las reducimos automáticamente a máximo
                2000×2000 px sin deformarlas.
              </p>
              {galeria.length > 0 ? (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {galeria.map((g) => (
                    <li
                      key={g.id}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={g.url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-muted-foreground opacity-0 shadow transition-opacity group-hover:opacity-100 hover:text-destructive"
                        aria-label="Quitar foto"
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
              ) : null}
            </div>

            <div className="space-y-4 border-t border-border pt-6">
              <div>
                <Label className="inline-flex items-center gap-2">
                  <Link2 className="h-4 w-4" /> Enlaces externos
                </Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Opcional. Noticias, redes o páginas relacionadas con el
                  convite.
                </p>
              </div>
              {enlaces.map((enlace, idx) => (
                <div
                  key={enlace.id}
                  className="grid gap-3 rounded-lg border border-border bg-background p-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end"
                >
                  <div className="space-y-2">
                    <Label htmlFor={`enlace-t-${enlace.id}`}>
                      {idx === 0 ? "Título" : ""}
                    </Label>
                    <Input
                      id={`enlace-t-${enlace.id}`}
                      placeholder="Ej: Nota en El Tiempo"
                      value={enlace.titulo}
                      onChange={(e) =>
                        setEnlaces((prev) =>
                          prev.map((x) =>
                            x.id === enlace.id
                              ? { ...x, titulo: e.target.value }
                              : x,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`enlace-u-${enlace.id}`}>
                      {idx === 0 ? "URL" : ""}
                    </Label>
                    <Input
                      id={`enlace-u-${enlace.id}`}
                      type="url"
                      placeholder="https://"
                      value={enlace.url}
                      onChange={(e) =>
                        setEnlaces((prev) =>
                          prev.map((x) =>
                            x.id === enlace.id
                              ? { ...x, url: e.target.value }
                              : x,
                          ),
                        )
                      }
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Eliminar enlace"
                    onClick={() =>
                      setEnlaces((prev) =>
                        prev.filter((x) => x.id !== enlace.id),
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
                      { id: crypto.randomUUID(), titulo: "", url: "" },
                    ])
                  }
                >
                  <Plus className="h-4 w-4" /> Agregar enlace
                </Button>
              ) : null}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-lg border border-primary/25 bg-primary/5 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">Verificación comunitaria</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Para publicar necesitamos confirmar quién organiza el convite.
                  Un líder o entidad de confianza de la zona respalda la solicitud.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsable">Persona responsable</Label>
              <Input
                id="responsable"
                placeholder="Nombre completo"
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="respaldo">Quién respalda este convite</Label>
              <Input
                id="respaldo"
                placeholder="Ej: Junta de Acción Comunal, parroquia, alcaldía..."
                value={respaldo}
                onChange={(e) => setRespaldo(e.target.value)}
              />
            </div>
            <PhoneInput
              id="contacto"
              label="Teléfono de contacto"
              value={contacto}
              onChange={setContacto}
              required
            />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Estos datos solo los ve el equipo de moderación. No se publican.
            </p>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {categoriaNombre}
              </p>
              <h2 className="text-balance font-serif text-2xl text-foreground">
                {title || "Título del convite"}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {summary || "Resumen breve del convite."}
              </p>
            </div>
            <dl className="grid gap-3 rounded-lg bg-muted/50 p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Municipio</dt>
                <dd className="text-foreground">{zonaNombre}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Lugar</dt>
                <dd className="text-foreground">{lugarConvite || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Fecha límite</dt>
                <dd className="text-foreground">{deadline || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Día de trabajo</dt>
                <dd className="text-foreground">{workday || "—"}</dd>
              </div>
            </dl>
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">
                Lo que se necesita
              </p>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {items
                  .filter((it) => it.name.trim())
                  .map((it) => (
                    <li
                      key={it.id}
                      className="flex items-center justify-between px-4 py-3 text-sm"
                    >
                      <span className="text-foreground">{it.name}</span>
                      <span className="text-muted-foreground">
                        {it.quantity} {it.unit}
                      </span>
                    </li>
                  ))}
                {items.filter((it) => it.name.trim()).length === 0 && (
                  <li className="px-4 py-3 text-sm text-muted-foreground">
                    Aún no agregaste ítems.
                  </li>
                )}
              </ul>
            </div>
            <ExternalMoneyCallout />

            <div className="space-y-3 rounded-xl border border-border bg-card p-4 sm:p-5">
              <p className="text-sm font-semibold text-foreground">
                Antes de enviar a revisión
              </p>
              <p className="text-sm text-muted-foreground">
                Debes aceptar ambos para habilitar el envío.
              </p>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-4 transition-colors hover:border-primary/40">
                <span
                  className={[
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border",
                    aceptaTerminos
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-foreground/40 bg-background",
                  ].join(" ")}
                  aria-hidden
                >
                  {aceptaTerminos ? <Check className="size-3.5" /> : null}
                </span>
                <input
                  type="checkbox"
                  checked={aceptaTerminos}
                  onChange={(e) => setAceptaTerminos(e.target.checked)}
                  className="sr-only"
                />
                <span className="text-sm leading-relaxed text-foreground">
                  He leído y acepto las{" "}
                  <Link
                    href="/terminos"
                    target="_blank"
                    className="font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    reglas y términos
                  </Link>{" "}
                  de Convites.
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-4 transition-colors hover:border-primary/40">
                <span
                  className={[
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border",
                    aceptaDescargo
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-foreground/40 bg-background",
                  ].join(" ")}
                  aria-hidden
                >
                  {aceptaDescargo ? <Check className="size-3.5" /> : null}
                </span>
                <input
                  type="checkbox"
                  checked={aceptaDescargo}
                  onChange={(e) => setAceptaDescargo(e.target.checked)}
                  className="sr-only"
                />
                <span className="text-sm leading-relaxed text-foreground">
                  Acepto el{" "}
                  <Link
                    href="/descargo-de-responsabilidad"
                    target="_blank"
                    className="font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    descargo de responsabilidad
                  </Link>
                  . Entiendo que Convites es solo una herramienta de coordinación,
                  que soy responsable de los datos que entrego y que la plataforma
                  y su desarrollador quedan liberados de responsabilidad por los
                  acuerdos y aportes entre las partes.
                </span>
              </label>
            </div>
          </div>
        )}

        {error ? (
          <p className="mt-4 text-sm text-destructive">{error}</p>
        ) : null}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
          <Button
            variant="ghost"
            onClick={onBack}
            disabled={step === 0 || submitting || savingDraft}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Atrás
          </Button>
          {step < steps.length - 1 ? (
            <Button
              onClick={() => void onContinue()}
              disabled={
                !canContinue || submitting || savingDraft || mediaBusy
              }
              className="gap-2"
            >
              {savingDraft ? "Guardando…" : "Continuar"}{" "}
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => void onEnviarRevision()}
              disabled={
                !aceptaTerminos ||
                !aceptaDescargo ||
                submitting ||
                savingDraft
              }
              className="gap-2"
            >
              {submitting || savingDraft ? "Enviando…" : "Enviar a revisión"}{" "}
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
