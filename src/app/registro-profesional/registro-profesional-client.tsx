"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { BrandMark } from "@/components/layout/brand-mark"
import { DepartamentoMunicipioSelect } from "@/components/ui/departamento-municipio-select"
import { PhoneInput, isPhoneValid } from "@/components/ui/phone-input"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { ApiError } from "@/lib/api"
import { registrarProfesional } from "@/lib/convites-api"
import { AREA_PROFESIONAL, type AreaProfesional } from "@/lib/data"
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
import { cn } from "@/lib/utils"

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
const MAX_MB = 10

type Archivo = { id: string; nombre: string; tamano: number }

function formatoTamano(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function RegistroProfesionalClient() {
  const { token, user, loading: authLoading } = useRequireAuth("/registro-profesional")
  const router = useRouter()
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

  // Certificados (UI; el API aún no recibe archivos en este endpoint)
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
    const nuevos: Archivo[] = []
    for (const f of Array.from(fileList)) {
      if (f.size > MAX_MB * 1024 * 1024) {
        setError(`"${f.name}" supera el límite de ${MAX_MB} MB.`)
        continue
      }
      nuevos.push({
        id: `${f.name}-${f.size}-${crypto.randomUUID()}`,
        nombre: f.name,
        tamano: f.size,
      })
    }
    setArchivos((prev) => [...prev, ...nuevos])
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
  const certificadosOk = archivos.length > 0
  const puedeEnviar = Boolean(datosOk && certificadosOk && acepta && token && !submitting)

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

  if (authLoading || !token) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center text-sm text-muted-foreground">
        Comprobando sesión…
      </div>
    )
  }

  if (done) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-6 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Clock className="h-8 w-8" />
        </div>
        <div className="space-y-3">
          <h1 className="text-pretty font-serif text-3xl text-foreground">
            Recibimos tu registro, {nombre.split(" ")[0] || "profesional"}
          </h1>
          <p className="text-pretty leading-relaxed text-muted-foreground">
            Un miembro del equipo revisará tu perfil. Cuando quede aprobado te
            avisaremos por correo y aparecerás en Manos profesionales.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button render={<Link href="/manos-profesionales" />}>
            Volver a Manos profesionales
          </Button>
          <Button variant="outline" render={<Link href="/explorar" />}>
            Ver convites abiertos
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:py-14">
      <BrandMark className="mb-8" />

      <Link
        href="/manos-profesionales"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a Manos profesionales
      </Link>

      <div className="mb-8">
        <p className="text-sm font-medium text-primary">Voluntariado especializado</p>
        <h1 className="mt-2 text-balance font-serif text-3xl text-foreground md:text-4xl">
          Regístrate como profesional
        </h1>
        <p className="mt-3 max-w-lg text-pretty leading-relaxed text-muted-foreground">
          Para cuidar a la comunidad, verificamos que cada profesional esté
          debidamente autorizado. Completa tus datos antes de publicar tu perfil.
        </p>
      </div>

      <div className="space-y-6 rounded-xl border border-border bg-card p-6 md:p-8">
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
            required
          />
          <div className="space-y-2">
            <Label htmlFor="area">Área profesional</Label>
            <Select
              value={area}
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
                Adjunta al menos un documento que te autorice como profesional:
                diploma, acta de grado o tarjeta profesional. Por ahora el
                registro se envía sin archivos; el equipo te pedirá los
                documentos por correo si hace falta. PDF o imagen, hasta{" "}
                {MAX_MB} MB cada uno.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-foreground">
              Certificados{" "}
              <span className="font-normal text-destructive">*</span>
            </Label>
            <span className="text-xs text-muted-foreground">
              {archivos.length} adjunto{archivos.length === 1 ? "" : "s"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background px-4 py-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
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

          {error && (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <Info className="h-4 w-4" /> {error}
            </p>
          )}

          {archivos.length > 0 && (
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
          )}
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

        {!certificadosOk && (
          <p className={cn("text-center text-xs text-muted-foreground")}>
            Adjunta al menos un certificado para poder enviar tu registro.
          </p>
        )}
      </div>
    </div>
  )
}
