"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AceptacionesLegales } from "@/components/auth/aceptaciones-legales"
import { GoogleButton } from "@/components/auth/google-button"
import { useAuth } from "@/components/auth/auth-provider"
import { PhoneInput, isPhoneValid } from "@/components/ui/phone-input"
import { ApiError } from "@/lib/api"
import { consumeAuthNext, rememberAuthNext, safeNextPath } from "@/lib/auth-next"
import { useResendCooldown } from "@/hooks/use-resend-cooldown"
import { ArrowLeft, Check } from "lucide-react"

export function RegistrarseClient() {
  const { register, verifyRegister, resendRegisterCode, completeGoogleRegistro } =
    useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextParam = safeNextPath(searchParams.get("next"), "")

  const [step, setStep] = useState<"datos" | "codigo" | "google">("datos")
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { remaining, start: startCooldown, canResend } = useResendCooldown(60)

  const [nombre, setNombre] = useState("")
  const [correo, setCorreo] = useState("")
  const [codigo, setCodigo] = useState("")
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [aceptaDescargo, setAceptaDescargo] = useState(false)

  const [googleCode, setGoogleCode] = useState<string | null>(null)
  const [celular, setCelular] = useState("")
  const codeInputRef = useRef<HTMLInputElement>(null)

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
    if (code) {
      setGoogleCode(code)
      setStep("google")
    }
  }, [searchParams])

  useEffect(() => {
    if (step === "codigo") {
      codeInputRef.current?.focus()
    }
  }, [step])

  function destinoTrasRegistro(): string {
    if (nextParam) return nextParam
    return consumeAuthNext("/panel/aportante")
  }

  const viaGoogle = Boolean(googleCode)

  const canEnviarCodigo =
    aceptaTerminos &&
    aceptaDescargo &&
    nombre.trim().length > 1 &&
    correo.trim().includes("@")

  const canVerificar = /^\d{4}$/.test(codigo.trim())

  const canCompletarGoogle =
    viaGoogle &&
    aceptaTerminos &&
    aceptaDescargo &&
    isPhoneValid(celular, true)

  async function onEnviarCodigo() {
    if (!canEnviarCodigo || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await register({
        name: nombre.trim(),
        email: correo.trim(),
        acepta_terminos: true,
        acepta_descargo: true,
      })
      setCorreo(res.email)
      setCodigo("")
      setStep("codigo")
      startCooldown(60)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message ||
              Object.values(err.body.errors ?? {})[0]?.[0] ||
              "No pudimos enviar el código."
          : "No pudimos enviar el código.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function onVerificar() {
    if (!canVerificar || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await verifyRegister({
        email: correo.trim(),
        code: codigo.trim(),
      })
      router.push(destinoTrasRegistro())
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message ||
              Object.values(err.body.errors ?? {})[0]?.[0] ||
              "No pudimos verificar el código."
          : "No pudimos verificar el código.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function onReenviar() {
    if (resending || !canResend || !correo.trim()) return
    setResending(true)
    setError(null)
    try {
      await resendRegisterCode(correo.trim())
      startCooldown(60)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message ||
              Object.values(err.body.errors ?? {})[0]?.[0] ||
              "No pudimos reenviar el código."
          : "No pudimos reenviar el código.",
      )
    } finally {
      setResending(false)
    }
  }

  async function onCompletarGoogle() {
    if (!googleCode || !canCompletarGoogle || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await completeGoogleRegistro({
        code: googleCode,
        acepta_terminos: true,
        acepta_descargo: true,
        ...(celular.trim() ? { celular: celular.trim() } : {}),
      })
      try {
        sessionStorage.removeItem("convites_google_pending_code")
      } catch {
        // ignore
      }
      router.push(destinoTrasRegistro())
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.body.message || "No pudimos crear tu cuenta."
          : "No pudimos crear tu cuenta."
      if (err instanceof ApiError && err.status === 404) {
        setError(
          "Ese código de Google ya no sirve (o tu cuenta ya existe). Entra con Continuar con Google en Ingresar.",
        )
        try {
          sessionStorage.removeItem("convites_google_pending_code")
        } catch {
          // ignore
        }
        setGoogleCode(null)
        setStep("datos")
      } else {
        setError(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 md:py-14">
      <div className="mb-8">
        <Link
          href={
            nextParam
              ? `/ingresar?next=${encodeURIComponent(nextParam)}`
              : "/"
          }
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {nextParam ? "Volver" : "Volver al inicio"}
        </Link>
        <h1 className="text-balance font-serif text-3xl text-foreground md:text-4xl">
          {step === "codigo" ? "Revisa tu correo" : "Únete a la comunidad"}
        </h1>
        <p className="mt-2 max-w-lg text-pretty leading-relaxed text-muted-foreground">
          {step === "codigo"
            ? `Te enviamos un código de 4 dígitos a ${correo}.`
            : "Solo nombre y correo. Te enviamos un código para verificar y listo."}
        </p>
        {nextParam ? (
          <p className="mt-2 text-sm text-primary">
            Cuando termines, te devolvemos para que continues aportando.
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 md:p-8">
        {step === "datos" ? (
          <div className="space-y-6">
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
                Marca términos y descargo para continuar.
              </p>
            ) : null}
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
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="correo">Correo electrónico</Label>
                <Input
                  id="correo"
                  type="email"
                  placeholder="tu@correo.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={!canEnviarCodigo || submitting}
              onClick={() => void onEnviarCodigo()}
            >
              {submitting ? "Enviando…" : "Enviar código"}
            </Button>
          </div>
        ) : null}

        {step === "codigo" ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código de 4 dígitos</Label>
              <Input
                ref={codeInputRef}
                id="codigo"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={4}
                placeholder="••••"
                value={codigo}
                onChange={(e) =>
                  setCodigo(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") void onVerificar()
                }}
                className="text-center text-2xl tracking-[0.4em] font-semibold"
              />
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={!canVerificar || submitting}
              onClick={() => void onVerificar()}
            >
              {submitting ? "Verificando…" : "Verificar y continuar"}
              {!submitting ? <Check className="ml-1.5 size-4" /> : null}
            </Button>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <button
                type="button"
                className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                onClick={() => {
                  setStep("datos")
                  setCodigo("")
                  setError(null)
                }}
              >
                Cambiar correo
              </button>
              <button
                type="button"
                disabled={resending || !canResend}
                className="font-medium text-primary underline-offset-2 hover:underline disabled:opacity-50"
                onClick={() => void onReenviar()}
              >
                {resending
                  ? "Reenviando…"
                  : !canResend
                    ? `Reenviar en ${remaining}s`
                    : "Reenviar código"}
              </button>
            </div>
          </div>
        ) : null}

        {step === "google" ? (
          <div className="space-y-6">
            <p className="rounded-lg border border-primary/25 bg-primary/5 p-4 text-sm text-muted-foreground">
              Google ya verificó tu identidad. Confirma términos y tu celular
              para crear la cuenta.
            </p>
            <AceptacionesLegales
              aceptaTerminos={aceptaTerminos}
              aceptaDescargo={aceptaDescargo}
              onTerminosChange={setAceptaTerminos}
              onDescargoChange={setAceptaDescargo}
            />
            <PhoneInput
              id="celular"
              label="Celular"
              value={celular}
              onChange={setCelular}
              required
            />
            <Button
              className="w-full"
              size="lg"
              disabled={!canCompletarGoogle || submitting}
              onClick={() => void onCompletarGoogle()}
            >
              {submitting ? "Creando…" : "Crear mi cuenta"}
            </Button>
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 text-sm text-destructive">{error}</p>
        ) : null}
      </div>

      {step === "datos" ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link
            href={
              nextParam
                ? `/ingresar?next=${encodeURIComponent(nextParam)}`
                : "/ingresar"
            }
            className="font-medium text-primary transition-colors hover:text-primary/80"
          >
            Ingresar
          </Link>
        </p>
      ) : null}
    </div>
  )
}
