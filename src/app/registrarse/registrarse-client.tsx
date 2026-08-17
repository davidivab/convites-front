"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { GoogleButton } from "@/components/auth/google-button"
import { BrandMark } from "@/components/layout/brand-mark"
import { useAuth } from "@/components/auth/auth-provider"
import { DepartamentoMunicipioSelect } from "@/components/ui/departamento-municipio-select"
import { PhoneInput, isPhoneValid } from "@/components/ui/phone-input"
import { ApiError } from "@/lib/api"
import { updateProfile } from "@/lib/convites-api"
import {
  HABILIDADES_MANUALES,
  HABILIDADES_CONOCIMIENTO,
  DISPONIBILIDAD,
  APTITUD_FISICA,
  GENEROS,
} from "@/lib/data"
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
  const { register } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  // Paso 2 — habilidades
  const [manuales, setManuales] = useState<string[]>([])
  const [conocimiento, setConocimiento] = useState<string[]>([])
  const [disponibilidad, setDisponibilidad] = useState<string[]>([])

  // Aceptaciones obligatorias para crear la cuenta
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [aceptaDescargo, setAceptaDescargo] = useState(false)

  function toggle(
    value: string,
    list: string[],
    setList: (v: string[]) => void,
  ) {
    setList(
      list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value],
    )
  }

  const canContinue =
    (step === 0 &&
      nombre.trim() &&
      isPhoneValid(celular, true) &&
      correo.trim() &&
      password.trim()) ||
    step === 1 ||
    step === 2

  async function onCrearCuenta() {
    if (!aceptaTerminos || !aceptaDescargo || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await register({
        name: nombre.trim(),
        email: correo.trim(),
        password,
        password_confirmation: password,
      })
      if (municipioId || genero || edad || aptitud || salud.trim()) {
        try {
          await updateProfile("session", {
            ...(municipioId ? { municipio_id: Number(municipioId) } : {}),
            ...(genero ? { genero } : {}),
            ...(edad ? { edad: Number(edad) } : {}),
            ...(aptitud ? { aptitud_fisica: aptitud } : {}),
            ...(salud.trim() ? { notas_salud: salud.trim() } : {}),
            ...(celular.trim() ? { celular: celular.trim() } : {}),
          })
        } catch {
          // Cuenta creada; el perfil se puede completar después.
        }
      }
      router.push("/panel/aportante")
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos crear tu cuenta."
          : "No pudimos crear tu cuenta.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:py-14">
      <BrandMark className="mb-8" />
      <div className="mb-8">
        <Link
          href="/ingresar"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Ya tengo cuenta
        </Link>
        <h1 className="text-balance font-serif text-3xl text-foreground md:text-4xl">
          Únete a la comunidad
        </h1>
        <p className="mt-2 max-w-lg text-pretty leading-relaxed text-muted-foreground">
          Crear tu cuenta nos ayuda a conectarte con los convites donde de verdad
          puedes aportar, según lo que sabes hacer y tu disponibilidad.
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
          <div className="space-y-6">
            <GoogleButton href="/explorar" label="Registrarme con Google" />
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              <span>o con tu correo</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: María Elena Restrepo"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <PhoneInput
                  id="celular"
                  label="Celular"
                  value={celular}
                  onChange={setCelular}
                  required
                />
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
              </div>
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
                  value={genero}
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
              optional
            />

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
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-foreground">
                ¿Qué sabes hacer con las manos?
              </legend>
              <p className="text-sm text-muted-foreground">
                Marca todos los oficios en los que puedes echar una mano.
              </p>
              <div className="flex flex-wrap gap-2">
                {HABILIDADES_MANUALES.map((h) => (
                  <Chip
                    key={h}
                    active={manuales.includes(h)}
                    onClick={() => toggle(h, manuales, setManuales)}
                  >
                    {h}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-foreground">
                ¿Con qué conocimientos puedes aportar?
              </legend>
              <div className="flex flex-wrap gap-2">
                {HABILIDADES_CONOCIMIENTO.map((h) => (
                  <Chip
                    key={h}
                    active={conocimiento.includes(h)}
                    onClick={() => toggle(h, conocimiento, setConocimiento)}
                  >
                    {h}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-foreground">
                ¿Cuándo tienes disponibilidad?
              </legend>
              <div className="flex flex-wrap gap-2">
                {DISPONIBILIDAD.map((d) => (
                  <Chip
                    key={d}
                    active={disponibilidad.includes(d)}
                    onClick={() => toggle(d, disponibilidad, setDisponibilidad)}
                  >
                    {d}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <div className="space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
                <input
                  type="checkbox"
                  checked={aceptaTerminos}
                  onChange={(e) => setAceptaTerminos(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                />
                <span className="text-sm leading-relaxed text-muted-foreground">
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
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
                <input
                  type="checkbox"
                  checked={aceptaDescargo}
                  onChange={(e) => setAceptaDescargo(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                />
                <span className="text-sm leading-relaxed text-muted-foreground">
                  Declaro que los datos que entrego son veraces y de mi
                  responsabilidad, y acepto el{" "}
                  <Link
                    href="/descargo-de-responsabilidad"
                    target="_blank"
                    className="font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    descargo de responsabilidad
                  </Link>
                  . Entiendo que Convites es solo una herramienta de coordinación y
                  que la plataforma y su desarrollador quedan liberados de toda
                  responsabilidad por los acuerdos, aportes o datos entregados
                  entre las partes.
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
              onClick={() => setStep((s) => s + 1)}
              disabled={!canContinue}
              className="gap-2"
            >
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
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

      {step === 0 && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Al registrarte aceptas nuestras{" "}
          <Link
            href="/terminos"
            className="font-medium text-primary transition-colors hover:text-primary/80"
          >
            reglas de convivencia
          </Link>
          .
        </p>
      )}
    </div>
  )
}
