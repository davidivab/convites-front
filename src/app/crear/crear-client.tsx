"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { ApiError } from "@/lib/api"
import {
  createIniciativa,
  enviarRevision,
  fetchCatalogos,
} from "@/lib/convites-api"
import type { ApiCategoria } from "@/lib/types"
import {
  CREAR_STEP_SCHEMAS,
  crearFormSchema,
  type CrearFormValues,
} from "@/lib/crear-schema"
import {
  Check,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
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

const steps = [
  "Sobre el convite",
  "Ubicación y fechas",
  "Qué se necesita",
  "Verificación",
  "Revisar y publicar",
]

const URGENCIAS = [
  { value: "alta", label: "Urgencia alta" },
  { value: "media", label: "Urgencia media" },
  { value: "baja", label: "Sin prisa" },
] as const

export function CrearClient() {
  const { token, loading: authLoading } = useRequireAuth("/crear")
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [categorias, setCategorias] = useState<ApiCategoria[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)

  // Form state
  const [title, setTitle] = useState("")
  const [categoriaId, setCategoriaId] = useState("")
  const [urgencia, setUrgencia] = useState<string>("media")
  const [summary, setSummary] = useState("")
  const [story, setStory] = useState("")
  const [zonaId, setZonaId] = useState("")
  const [municipioNombre, setMunicipioNombre] = useState("—")
  const [lugarConvite, setLugarConvite] = useState("")
  const [lugarExacto, setLugarExacto] = useState("")
  const [ubicacion, setUbicacion] = useState<MapLocation | null>(null)
  const [deadline, setDeadline] = useState("")
  const [workday, setWorkday] = useState("")
  const [items, setItems] = useState<NeededItem[]>([
    { id: "1", name: "", unit: "", quantity: "" },
  ])
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
    const schema = CREAR_STEP_SCHEMAS[Math.min(step, 3)]
    const parsed = schema.safeParse(snapshot())
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa los campos de este paso")
      return false
    }
    setError(null)
    return true
  }

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

  function updateItem(id: string, patch: Partial<NeededItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", unit: "", quantity: "" },
    ])
  }

  function removeItem(id: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev))
  }

  const categoriaNombre =
    categorias.find((c) => String(c.id) === categoriaId)?.nombre || "Sin categoría"
  const zonaNombre = municipioNombre

  const canContinue =
    (step === 0 && title.trim() && categoriaId && summary.trim() && urgencia) ||
    (step === 1 && zonaId && lugarConvite.trim()) ||
    (step === 2 &&
      items.some((it) => it.name.trim() && it.unit.trim() && it.quantity)) ||
    (step === 3 &&
      responsable.trim() &&
      respaldo.trim() &&
      isPhoneValid(contacto, true)) ||
    step === 4

  async function onEnviarRevision() {
    if (!token || submitting) return

    const parsed = crearFormSchema.safeParse(snapshot())
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa el formulario")
      return
    }

    const validItems = items.filter(
      (it) => it.name.trim() && it.unit.trim() && Number(it.quantity) > 0,
    )

    const historiaParrafos = story
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean)
    const historia =
      historiaParrafos.length > 0 ? historiaParrafos : [summary.trim()]

    setSubmitting(true)
    setError(null)
    try {
      const created = await createIniciativa(token, {
        municipio_id: Number(zonaId),
        categoria_id: Number(categoriaId),
        titulo: title.trim(),
        resumen: summary.trim(),
        historia,
        urgencia,
        lugar_convite: lugarConvite.trim(),
        lugar_exacto: lugarExacto.trim() || null,
        lat: ubicacion?.lat ?? null,
        lng: ubicacion?.lng ?? null,
        geo_fuente: ubicacion?.fuente ?? null,
        geo_precision: "punto",
        mapa_visible: true,
        fecha_limite_aportes: deadline || null,
        fecha_convite: workday || null,
        fecha_convite_texto: workday || null,
        persona_responsable: responsable.trim(),
        quien_respalda: respaldo.trim(),
        telefono_contacto: contacto.trim(),
        items: validItems.map((it) => ({
          nombre: it.name.trim(),
          unidad: it.unit.trim(),
          cantidad_meta: Number(it.quantity),
        })),
      })
      await enviarRevision(token, created.id)
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

  if (authLoading || !token) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center text-sm text-muted-foreground">
        Comprobando sesión…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl py-10 md:py-14">
      <div className="mb-8">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>
        <h1 className="text-balance font-serif text-3xl text-foreground md:text-4xl">
          Abre un convite
        </h1>
        <p className="mt-2 max-w-xl text-pretty leading-relaxed text-muted-foreground">
          Cuéntanos qué necesita tu comunidad. Las personas aportan trabajo,
          materiales y tiempo, nunca dinero a través de la plataforma.
        </p>
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
              <Label htmlFor="story">La historia (opcional)</Label>
              <Textarea
                id="story"
                rows={5}
                placeholder="Cuenta con más detalle qué pasó y por qué la comunidad se está uniendo."
                value={story}
                onChange={(e) => setStory(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <DepartamentoMunicipioSelect
              municipioId={zonaId}
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
              {items.map((it, idx) => (
                <div
                  key={it.id}
                  className="grid gap-3 rounded-lg border border-border bg-background p-4 sm:grid-cols-[1fr_130px_130px_auto] sm:items-end"
                >
                  <div className="space-y-2">
                    <Label htmlFor={`name-${it.id}`}>
                      {idx === 0 ? "Qué se necesita" : ""}
                    </Label>
                    <Input
                      id={`name-${it.id}`}
                      placeholder="Ej: Tejas de zinc"
                      value={it.name}
                      onChange={(e) => updateItem(it.id, { name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`qty-${it.id}`}>{idx === 0 ? "Cantidad" : ""}</Label>
                    <Input
                      id={`qty-${it.id}`}
                      type="number"
                      min={1}
                      placeholder="40"
                      value={it.quantity}
                      onChange={(e) => updateItem(it.id, { quantity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`unit-${it.id}`}>{idx === 0 ? "Unidad" : ""}</Label>
                    <Input
                      id={`unit-${it.id}`}
                      placeholder="tejas"
                      value={it.unit}
                      onChange={(e) => updateItem(it.id, { unit: e.target.value })}
                    />
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

        {step === 4 && (
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
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || submitting}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Atrás
          </Button>
          {step < steps.length - 1 ? (
            <Button
              onClick={() => {
                if (!validateStepOrError()) return
                setStep((s) => s + 1)
              }}
              disabled={!canContinue}
              className="gap-2"
            >
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => void onEnviarRevision()}
              disabled={!aceptaTerminos || !aceptaDescargo || submitting}
              className="gap-2"
            >
              {submitting ? "Enviando…" : "Enviar a revisión"}{" "}
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
