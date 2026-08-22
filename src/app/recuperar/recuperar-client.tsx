"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth/auth-provider"
import { ApiError } from "@/lib/api"
import {
  authNextQuery,
  consumeAuthNext,
  rememberAuthNext,
  safeNextPath,
} from "@/lib/auth-next"
import { useResendCooldown } from "@/hooks/use-resend-cooldown"
import { ArrowLeft, Check } from "lucide-react"

export function RecuperarClient() {
  const { requestRecover, verifyRecover, resendRecoverCode } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextParam = safeNextPath(searchParams.get("next"))

  const [step, setStep] = useState<"email" | "codigo">("email")
  const [correo, setCorreo] = useState("")
  const [codigo, setCodigo] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const codeInputRef = useRef<HTMLInputElement>(null)
  const { remaining, start: startCooldown, canResend } = useResendCooldown(60)

  useEffect(() => {
    rememberAuthNext(nextParam)
  }, [nextParam])

  useEffect(() => {
    if (step === "codigo") codeInputRef.current?.focus()
  }, [step])

  function destino(): string {
    if (nextParam) return nextParam
    return consumeAuthNext("/panel/aportante")
  }

  async function onEnviar() {
    if (!correo.trim().includes("@") || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await requestRecover(correo.trim())
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
    if (!/^\d{4}$/.test(codigo.trim()) || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await verifyRecover({
        email: correo.trim(),
        code: codigo.trim(),
      })
      router.push(destino())
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
      await resendRecoverCode(correo.trim())
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

  return (
    <div className="mx-auto max-w-sm px-6 py-12">
      <Link
        href={`/ingresar${authNextQuery(nextParam)}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a ingresar
      </Link>

      <h1 className="text-balance font-serif text-3xl text-foreground">
        {step === "codigo" ? "Revisa tu correo" : "He olvidado mi contraseña"}
      </h1>
      <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
        {step === "codigo" ? (
          <>
            Si <span className="text-foreground">{correo}</span> está registrado
            en Convites, te enviamos un código de 4 dígitos. Revisa tu bandeja
            (y spam) e ingrésalo abajo.
          </>
        ) : (
          "Si ese correo existe en nuestra base de datos, te enviaremos un código para entrar."
        )}
      </p>

      <div className="mt-8 space-y-5">
        {step === "email" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="correo">Correo electrónico</Label>
              <Input
                id="correo"
                type="email"
                required
                autoComplete="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="tu@correo.com"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void onEnviar()
                }}
              />
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={!correo.trim().includes("@") || submitting}
              onClick={() => void onEnviar()}
            >
              {submitting ? "Enviando…" : "Enviar código"}
            </Button>
          </>
        ) : (
          <>
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
              disabled={!/^\d{4}$/.test(codigo) || submitting}
              onClick={() => void onVerificar()}
            >
              {submitting ? "Verificando…" : "Entrar"}
              {!submitting ? <Check className="ml-1.5 size-4" /> : null}
            </Button>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <button
                type="button"
                className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                onClick={() => {
                  setStep("email")
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
          </>
        )}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  )
}
