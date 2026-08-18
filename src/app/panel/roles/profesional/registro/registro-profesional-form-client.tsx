"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
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
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { DepartamentoMunicipioSelect } from "@/components/ui/departamento-municipio-select"
import { PhoneInput, isPhoneValid } from "@/components/ui/phone-input"
import { useRequireRoleTree } from "@/hooks/use-require-role-tree"
import { ApiError } from "@/lib/api"
import { registrarProfesional } from "@/lib/convites-api"
import { AREA_PROFESIONAL, type AreaProfesional } from "@/lib/data"
import { perfilTabsForRole } from "@/lib/role-tree"
import {
  ArrowLeft,
  Check,
  FileCheck2,
  ShieldCheck,
  Upload,
  X,
  Clock,
  Info,
} from "lucide-react"

const AREAS = Object.entries(AREA_PROFESIONAL) as [
  AreaProfesional,
  { label: string; descripcion: string },
][]

const MODALIDADES = [
  { value: "presencial", label: "Presencial" },
  { value: "virtual", label: "Virtual" },
  { value: "presencial_y_virtual", label: "Presencial y virtual" },
] as const

const TIPOS_ACEPTADOS = ".pdf,.jpg,.jpeg,.png"
/** Alineado con RegisterProfesionalRequest (máx 5MB c/u, hasta 5) */
const MAX_MB = 5
const MAX_ARCHIVOS = 5

const RUTA = "/panel/roles/profesional/registro"

type Archivo = { id: string; nombre: string; tamano: number; file: File }

function formatoTamano(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function RegistroProfesionalFormClient() {
  const { token, user, loading: authLoading } = useRequireRoleTree(RUTA, [
    "aportante",
    "moderador",
    "profesional",
  ])
  const tabs = perfilTabsForRole(user, "/panel/roles/profesional")

  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [nombre, setNombre] = useState("")
  const [correo, setCorreo] = useState("")
  const [celular, setCelular] = useState("")
  const [municipioId, setMunicipioId] = useState("")
  const [area, setArea] = useState<string>("")
  const [titulo, setTitulo] = useState("")
  const [tarjeta, setTarjeta] = useState("")
  const [modalidad, setModalidad] = useState("presencial")
  const [disponibilidad, setDisponibilidad] = useState("")
  const [descripcion, setDescripcion] = useState("")

  const [archivos, setArchivos] = useState<Archivo[]>([])
  const [acepta, setAcepta] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setNombre((n) => n || user.name || "")
      setCorreo((c) => c || user.email || "")
    }
  }, [user])

  function agregarArchivos(fileList: FileList | null) {
    if (!fileList) return
    setError("")
    setArchivos((prev) => {
      const cupo = MAX_ARCHIVOS - prev.length
      if (cupo <= 0) {
        setError(`Máximo ${MAX_ARCHIVOS} archivos.`)
        return prev
      }
      const nuevos: Archivo[] = []
      for (const f of Array.from(fileList).slice(0, cupo)) {
        if (f.size > MAX_MB * 1024 * 1024) {
          setError(`"${f.name}" supera el límite de ${MAX_MB} MB.`)
          continue
        }
        nuevos.push({
          id: `${f.name}-${f.size}-${crypto.randomUUID()}`,
          nombre: f.name,
          tamano: f.size,
          file: f,
        })
      }
      return [...prev, ...nuevos]
    })
  }

  function quitar(id: string) {
    setArchivos((prev) => prev.filter((a) => a.id !== id))
  }

  const datosOk =
    nombre.trim() &&
    correo.trim() &&
    isPhoneValid(celular, true) &&
    municipioId &&
    area &&
    titulo.trim() &&
    modalidad &&
    disponibilidad.trim() &&
    descripcion.trim()
  const puedeEnviar = Boolean(datosOk && acepta && token && !submitting)

  async function onEnviar() {
    if (!puedeEnviar || !token) return
    setSubmitting(true)
    setError("")
    try {
      await registrarProfesional(token, {
        municipio_id: Number(municipioId),
        area,
        nombre: nombre.trim(),
        titulo: titulo.trim(),
        email: correo.trim(),
        celular: celular.trim() || null,
        tarjeta_profesional: tarjeta.trim() || null,
        modalidad,
        disponibilidad: disponibilidad.trim(),
        descripcion: descripcion.trim(),
        documentos: archivos.map((a) => a.file),
      })
      setDone(true)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos registrar tu perfil."
          : "No pudimos registrar tu perfil.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || !token || !user) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-muted-foreground">
        Cargando…
      </div>
    )
  }

  if (done) {
    return (
      <DashboardShell
        title="Solicitud enviada"
        subtitle="Tu perfil profesional quedó pendiente de aprobación."
        tabs={tabs}
      >
        <div className="mx-auto flex max-w-xl flex-col items-center gap-6 py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Clock className="h-8 w-8" />
          </div>
          <div className="space-y-3">
            <h2 className="text-pretty font-serif text-2xl text-foreground">
              Recibimos tu registro, {nombre.split(" ")[0] || "profesional"}
            </h2>
            <p className="text-pretty leading-relaxed text-muted-foreground">
              Tu solicitud quedó <strong>pendiente de aprobación</strong>. Aún no
              tienes el rol de profesional: un moderador o admin revisará tu
              perfil y, al aprobarlo, te avisaremos por correo y aparecerás en
              Manos profesionales.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button render={<Link href="/panel/roles/profesional" />}>
              Volver a Ser profesional
            </Button>
            <Button variant="outline" render={<Link href="/panel/profesional" />}>
              Ir a mi panel profesional
            </Button>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell
      title="Registro profesional"
      subtitle="Completa tus datos y documentos. Verificamos título y certificados antes de publicar tu perfil."
      tabs={tabs}
    >
      <Link
        href="/panel/roles/profesional"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a Ser profesional
      </Link>

      <div className="mx-auto max-w-2xl space-y-6 rounded-xl border border-border bg-card p-6 md:p-8">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input
              id="nombre"
              placeholder="Ej: Laura Cardona"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="correo">Correo electrónico</Label>
              <Input
                id="correo"
                type="email"
                placeholder="tu@correo.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </div>
            <PhoneInput
              id="celular"
              label="Celular"
              value={celular}
              onChange={setCelular}
              required
              className="sm:col-span-1"
            />
          </div>
          <DepartamentoMunicipioSelect
            municipioId={municipioId}
            onMunicipioChange={setMunicipioId}
            municipioLabel="Ciudad"
            required
          />
          <div className="space-y-2">
            <Label htmlFor="area">Área profesional</Label>
            <Select
              value={area || undefined}
              onValueChange={(v) => setArea(v ?? "")}
              items={AREAS.map(([value, info]) => ({
                value,
                label: info.label,
              }))}
            >
              <SelectTrigger id="area">
                <SelectValue placeholder="Elige tu área" />
              </SelectTrigger>
              <SelectContent>
                {AREAS.map(([value, info]) => (
                  <SelectItem key={value} value={value}>
                    {info.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="modalidad">Modalidad</Label>
              <Select
                value={modalidad}
                onValueChange={(v) => setModalidad(v ?? "presencial")}
                items={MODALIDADES.map((m) => ({
                  value: m.value,
                  label: m.label,
                }))}
              >
                <SelectTrigger id="modalidad">
                  <SelectValue placeholder="Cómo atiendes" />
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
            <div className="space-y-2">
              <Label htmlFor="tarjeta">Tarjeta profesional (opcional)</Label>
              <Input
                id="tarjeta"
                placeholder="N° de matrícula o tarjeta"
                value={tarjeta}
                onChange={(e) => setTarjeta(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="titulo">Título obtenido</Label>
            <Input
              id="titulo"
              placeholder="Ej: Psicóloga clínica — Universidad Tecnológica"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="disponibilidad">Disponibilidad</Label>
            <Input
              id="disponibilidad"
              placeholder="Ej: Martes y jueves por la tarde"
              value={disponibilidad}
              onChange={(e) => setDisponibilidad(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">¿Cómo puedes ayudar?</Label>
            <Textarea
              id="descripcion"
              rows={3}
              placeholder="Cuéntanos en qué puedes acompañar a la comunidad."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3 border-t border-border pt-6">
          <div className="flex items-start gap-2.5 rounded-lg bg-primary/5 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Verificación obligatoria
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Adjunta diploma, acta de grado o tarjeta profesional (opcional
                en el envío; el equipo puede pedirlos después). PDF o imagen,
                hasta {MAX_MB} MB cada uno, máximo {MAX_ARCHIVOS} archivos.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-foreground">
              Certificados{" "}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <span className="text-xs text-muted-foreground">
              {archivos.length}/{MAX_ARCHIVOS} adjunto
              {archivos.length === 1 ? "" : "s"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={archivos.length >= MAX_ARCHIVOS}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background px-4 py-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:pointer-events-none disabled:opacity-50"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Upload className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium text-foreground">
              Subir certificados
            </span>
            <span className="text-xs text-muted-foreground">
              Toca para seleccionar tus archivos (PDF, JPG o PNG)
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={TIPOS_ACEPTADOS}
            multiple
            className="sr-only"
            onChange={(e) => {
              agregarArchivos(e.target.files)
              e.target.value = ""
            }}
          />

          {error ? (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <Info className="h-4 w-4" /> {error}
            </p>
          ) : null}

          {archivos.length > 0 ? (
            <ul className="space-y-2">
              {archivos.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
                >
                  <FileCheck2 className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {a.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatoTamano(a.tamano)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => quitar(a.id)}
                    aria-label={`Quitar ${a.nombre}`}
                    className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <label className="flex cursor-pointer items-start gap-3 border-t border-border pt-6">
          <input
            type="checkbox"
            checked={acepta}
            onChange={(e) => setAcepta(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <span className="text-sm leading-relaxed text-muted-foreground">
            Declaro que la información y los documentos son verídicos y autorizo
            su verificación, según las{" "}
            <Link
              href="/terminos"
              className="font-medium text-primary transition-colors hover:text-primary/80"
            >
              reglas de convivencia
            </Link>
            .
          </span>
        </label>

        <Button
          className="w-full gap-2"
          disabled={!puedeEnviar}
          onClick={() => void onEnviar()}
        >
          <Check className="h-4 w-4" />{" "}
          {submitting ? "Enviando…" : "Enviar para verificación"}
        </Button>
      </div>
    </DashboardShell>
  )
}
