"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
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
import { AceptacionesLegales } from "@/components/auth/aceptaciones-legales"
import { GoogleButton } from "@/components/auth/google-button"
import { useAuth } from "@/components/auth/auth-provider"
import { DepartamentoMunicipioSelect } from "@/components/ui/departamento-municipio-select"
import { PhoneInput, isPhoneValid } from "@/components/ui/phone-input"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/lib/api"
import { fetchCatalogos } from "@/lib/convites-api"
import { consumeAuthNext, rememberAuthNext, safeNextPath } from "@/lib/auth-next"
import { APTITUD_FISICA, GENEROS } from "@/lib/data"
import type { ApiDisponibilidad, ApiHabilidad } from "@/lib/types"
import {
  Check,
  ArrowLeft,
  ArrowRight,
  Info,
} from "lucide-react"

const steps = ["Tus datos", "Sobre ti", "Cómo puedes ayudar"]

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "rounded-full border px-3.5 py-2 text-sm transition-colors",
        active
          ? "border-primary bg-primary/10 font-medium text-primary"
          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  )
}

export function RegistrarseClient() {
  const { register, completeGoogleRegistro } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextParam = safeNextPath(searchParams.get("next"), "")
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [googleCode, setGoogleCode] = useState<string | null>(null)

  // Paso 0 — contacto
  const [nombre, setNombre] = useState("")
  const [celular, setCelular] = useState("")
  const [correo, setCorreo] = useState("")
  const [password, setPassword] = useState("")

  // Paso 1 — sobre ti (opcional)
  const [genero, setGenero] = useState("")
  const [edad, setEdad] = useState("")
  const [aptitud, setAptitud] = useState("")
  const [salud, setSalud] = useState("")
  const [municipioId, setMunicipioId] = useState("")
  const [barrio, setBarrio] = useState("")

  // Paso 2 — habilidades (IDs del catálogo API)
  const [habilidadIds, setHabilidadIds] = useState<number[]>([])
  const [disponibilidadIds, setDisponibilidadIds] = useState<number[]>([])
  const [habilidades, setHabilidades] = useState<ApiHabilidad[]>([])
  const [disponibilidades, setDisponibilidades] = useState<ApiDisponibilidad[]>(
    [],
  )
  const [catalogLoading, setCatalogLoading] = useState(true)

  // Aceptaciones obligatorias para crear la cuenta
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [aceptaDescargo, setAceptaDescargo] = useState(false)

  useEffect(() => {
    if (nextParam) rememberAuthNext(nextParam)
  }, [nextParam])

  useEffect(() => {
    const fromQuery = searchParams.get("google_code")
    let fromSession: string | null = null
    try {
      fromSession = sessionStorage.getItem("convites_google_pending_code")
    } catch {
      // ignore
    }
    const code = fromQuery || fromSession
    if (code) setGoogleCode(code)
  }, [searchParams])

  function destinoTrasRegistro(): string {
    if (nextParam) return nextParam
    return consumeAuthNext("/panel/aportante")
  }

  useEffect(() => {
    let cancelled = false
    async function loadCatalog() {
      setCatalogLoading(true)
      try {
        const cat = await fetchCatalogos(false)
        if (cancelled) return
        setHabilidades(cat.habilidades)
        setDisponibilidades(cat.disponibilidades)
      } catch {
        if (!cancelled) {
          setHabilidades([])
          setDisponibilidades([])
        }
      } finally {
        if (!cancelled) setCatalogLoading(false)
      }
    }
    void loadCatalog()
    return () => {
      cancelled = true
    }
  }, [])

  const viaGoogle = Boolean(googleCode)
  const manuales = habilidades.filter((h) => h.tipo === "manual")
  const conocimiento = habilidades.filter((h) => h.tipo === "conocimiento")

  function toggleId(
    id: number,
    list: number[],
    setList: (v: number[]) => void,
  ) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  }

  const canContinue =
    (step === 0 &&
      aceptaTerminos &&
      aceptaDescargo &&
      isPhoneValid(celular, true) &&
      (viaGoogle || (nombre.trim() && correo.trim() && password.trim()))) ||
    step === 1 ||
    step === 2

  async function onCrearCuenta() {
    if (!aceptaTerminos || !aceptaDescargo || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const perfilOpcional = {
        ...(celular.trim() ? { celular: celular.trim() } : {}),
        ...(municipioId ? { municipio_id: Number(municipioId) } : {}),
        ...(barrio.trim() ? { barrio: barrio.trim() } : {}),
        ...(genero ? { genero } : {}),
        ...(edad ? { edad: Number(edad) } : {}),
        ...(aptitud ? { aptitud_fisica: aptitud } : {}),
        ...(salud.trim() ? { notas_salud: salud.trim() } : {}),
        ...(habilidadIds.length ? { habilidad_ids: habilidadIds } : {}),
        ...(disponibilidadIds.length
          ? { disponibilidad_ids: disponibilidadIds }
          : {}),
      }

      if (viaGoogle && googleCode) {
        await completeGoogleRegistro({
          code: googleCode,
          acepta_terminos: true,
          acepta_descargo: true,
          ...perfilOpcional,
        })
        try {
          sessionStorage.removeItem("convites_google_pending_code")
        } catch {
          // ignore
        }
        router.push(destinoTrasRegistro())
        return
      }

      await register({
        name: nombre.trim(),
        email: correo.trim(),
        password,
        password_confirmation: password,
        ...perfilOpcional,
      })
      router.push(destinoTrasRegistro())
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.body.message || "No pudimos crear tu cuenta."
          : "No pudimos crear tu cuenta."
      if (
        err instanceof ApiError &&
        err.status === 404 &&
        viaGoogle
      ) {
        setError(
          "Ese código de Google ya no sirve (o tu cuenta ya existe). Entra con Continuar con Google en Ingresar: te autenticamos y, si faltaba algo, te llevamos a terminar el perfil.",
        )
        try {
          sessionStorage.removeItem("convites_google_pending_code")
        } catch {
          // ignore
        }
        setGoogleCode(null)
      } else {
        setError(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:py-14">
      <div className="mb-8">
        <Link
          href={nextParam ? `/ingresar?next=${encodeURIComponent(nextParam)}` : "/"}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {nextParam ? "Volver" : "Volver al inicio"}
        </Link>
        <h1 className="text-balance font-serif text-3xl text-foreground md:text-4xl">
          Únete a la comunidad
        </h1>
        <p className="mt-2 max-w-lg text-pretty leading-relaxed text-muted-foreground">
          Solo necesitas tus datos básicos para empezar. Lo demás del perfil es
          opcional y lo puedes completar después, sin interrumpir lo que estabas
          haciendo.
        </p>
        {nextParam ? (
          <p className="mt-2 text-sm text-primary">
            Cuando termines, te devolvemos para que continues aportando.
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
          <div className="space-y-6">
            {viaGoogle ? (
              <p className="rounded-lg border border-primary/25 bg-primary/5 p-4 text-sm text-muted-foreground">
                Google ya verificó tu identidad. Completa celular, términos y el
                resto de pasos — nombre y correo salen de tu cuenta de Google; no
                pedimos contraseña.
              </p>
            ) : (
              <>
                <AceptacionesLegales
                  aceptaTerminos={aceptaTerminos}
                  aceptaDescargo={aceptaDescargo}
                  onTerminosChange={setAceptaTerminos}
                  onDescargoChange={setAceptaDescargo}
                />
                <GoogleButton
                  label="Registrarme con Google"
                  disabled={!aceptaTerminos || !aceptaDescargo}
                  intent="register"
                />
                {!aceptaTerminos || !aceptaDescargo ? (
                  <p className="text-xs text-muted-foreground">
                    Marca términos y descargo para registrarte con Google o
                    continuar con correo.
                  </p>
                ) : null}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  <span>o con tu correo</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
              </>
            )}
            {viaGoogle ? (
              <AceptacionesLegales
                aceptaTerminos={aceptaTerminos}
                aceptaDescargo={aceptaDescargo}
                onTerminosChange={setAceptaTerminos}
                onDescargoChange={setAceptaDescargo}
              />
            ) : null}
            <div className="space-y-5">
              {!viaGoogle ? (
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre completo</Label>
                  <Input
                    id="nombre"
                    placeholder="Ej: María Elena Restrepo"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>
              ) : null}
              <div className="space-y-5">
                <PhoneInput
                  id="celular"
                  label="Celular"
                  value={celular}
                  onChange={setCelular}
                  required
                />
                {!viaGoogle ? (
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
                ) : null}
              </div>
              {!viaGoogle ? (
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              ) : null}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-start gap-2.5 rounded-lg bg-muted/60 p-4">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                Estos datos son opcionales y privados. Nos sirven solo para
                cuidarte: no te vamos a mandar a subir a un techo si no es lo
                tuyo.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="genero">Género (opcional)</Label>
                <Select
                  value={genero || undefined}
                  onValueChange={(v) => setGenero(v ?? "")}
                  items={GENEROS.map((g) => ({
                    value: g.value,
                    label: g.label,
                  }))}
                >
                  <SelectTrigger id="genero">
                    <SelectValue placeholder="Elige una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENEROS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edad">Edad (opcional)</Label>
                <Input
                  id="edad"
                  type="number"
                  min={14}
                  max={110}
                  placeholder="Ej: 34"
                  value={edad}
                  onChange={(e) => setEdad(e.target.value)}
                />
              </div>
            </div>

            <DepartamentoMunicipioSelect
              municipioId={municipioId}
              onMunicipioChange={setMunicipioId}
              municipioLabel="Ciudad"
              optional
            />

            <div className="space-y-2">
              <Label htmlFor="barrio">Barrio (opcional)</Label>
              <Textarea
                id="barrio"
                rows={2}
                placeholder="Ej: Villa Santana, Boston, Centro…"
                value={barrio}
                onChange={(e) => setBarrio(e.target.value)}
              />
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-foreground">
                ¿Qué tipo de labores puedes hacer?
              </legend>
              <div className="grid gap-3">
                {APTITUD_FISICA.map((a) => (
                  <label
                    key={a.value}
                    className={[
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                      aptitud === a.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="aptitud"
                      value={a.value}
                      checked={aptitud === a.value}
                      onChange={() => setAptitud(a.value)}
                      className="mt-1 h-4 w-4 accent-primary"
                    />
                    <span>
                      <span className="block font-medium text-foreground">
                        {a.label}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {a.hint}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="space-y-2">
              <Label htmlFor="salud">
                Condición de salud a tener en cuenta (opcional)
              </Label>
              <Input
                id="salud"
                placeholder="Ej: problema de espalda, embarazo, movilidad reducida..."
                value={salud}
                onChange={(e) => setSalud(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Solo lo usa el equipo para no asignarte tareas que te puedan
                hacer daño.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-7">
            {catalogLoading ? (
              <p className="text-sm text-muted-foreground">
                Cargando habilidades…
              </p>
            ) : habilidades.length === 0 ? (
              <p className="text-sm text-destructive">
                No hay catálogo de habilidades. En la API corre{" "}
                <code className="text-xs">php artisan local:ensure</code>.
              </p>
            ) : null}
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-foreground">
                ¿Qué sabes hacer con las manos?
              </legend>
              <p className="text-sm text-muted-foreground">
                Marca todos los oficios en los que puedes echar una mano.
              </p>
              <div className="flex flex-wrap gap-2">
                {manuales.map((h) => (
                  <Chip
                    key={h.id}
                    active={habilidadIds.includes(h.id)}
                    onClick={() =>
                      toggleId(h.id, habilidadIds, setHabilidadIds)
                    }
                  >
                    {h.nombre}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-foreground">
                ¿Con qué conocimientos puedes aportar?
              </legend>
              <div className="flex flex-wrap gap-2">
                {conocimiento.map((h) => (
                  <Chip
                    key={h.id}
                    active={habilidadIds.includes(h.id)}
                    onClick={() =>
                      toggleId(h.id, habilidadIds, setHabilidadIds)
                    }
                  >
                    {h.nombre}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-foreground">
                ¿Cuándo tienes disponibilidad?
              </legend>
              <div className="flex flex-wrap gap-2">
                {disponibilidades.map((d) => (
                  <Chip
                    key={d.id}
                    active={disponibilidadIds.includes(d.id)}
                    onClick={() =>
                      toggleId(d.id, disponibilidadIds, setDisponibilidadIds)
                    }
                  >
                    {d.nombre}
                  </Chip>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {error ? (
          <p className="mt-4 text-sm text-destructive">{error}</p>
        ) : null}

        {/* Navigation */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || submitting}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Atrás
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            {step < steps.length - 1 ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => void onCrearCuenta()}
                  disabled={!canContinue || submitting}
                >
                  {submitting ? "Creando…" : "Crear cuenta ahora"}
                </Button>
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canContinue}
                  className="gap-2"
                >
                  Completar perfil <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                onClick={() => void onCrearCuenta()}
                disabled={!aceptaTerminos || !aceptaDescargo || submitting}
                className="gap-2"
              >
                {submitting ? "Creando…" : "Crear mi cuenta"}{" "}
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
