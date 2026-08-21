"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import { ApiError } from "@/lib/api"
import { consumeAuthNext, peekAuthNext } from "@/lib/auth-next"
import { homeForRole, resolvePrimaryRole } from "@/lib/role-tree"

export function GoogleCallbackClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { completeGoogleLogin } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get("code")
    const needsRegistration = searchParams.get("needs_registration") === "1"
    const resumeOnboarding = searchParams.get("resume_onboarding") === "1"
    if (!code) {
      setError("Falta el código de Google. Vuelve a intentar el ingreso.")
      return
    }

    // P47: sin cuenta previa → completar registro (no exchange).
    if (needsRegistration) {
      try {
        sessionStorage.setItem("convites_google_pending_code", code)
      } catch {
        // ignore
      }
      const next = peekAuthNext()
      const qs = new URLSearchParams({ google_code: code })
      if (next) qs.set("next", next)
      router.replace(`/registrarse?${qs.toString()}`)
      return
    }

    let cancelled = false
    async function run() {
      try {
        const user = await completeGoogleLogin(code!)
        if (cancelled) return
        try {
          sessionStorage.removeItem("convites_google_pending_code")
        } catch {
          // ignore
        }
        // Si venía de aportar/unirse, vuelve ahí (no fuerces onboarding).
        const next = consumeAuthNext("")
        if (next) {
          router.replace(next)
          return
        }
        // Sin destino: onboarding suave solo si hace falta.
        if (resumeOnboarding || user.needs_onboarding) {
          router.replace("/perfil?onboarding=1")
          return
        }
        const home = homeForRole(resolvePrimaryRole(user) ?? "aportante")
        router.replace(home)
      } catch (err) {
        if (cancelled) return
        setError(
          err instanceof ApiError
            ? err.body.message || "No pudimos completar el ingreso con Google."
            : "No pudimos completar el ingreso con Google.",
        )
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [searchParams, completeGoogleLogin, router])

  if (error) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-sm flex-col justify-center px-6 py-16">
        <h1 className="font-serif text-2xl text-foreground">No se pudo entrar</h1>
        <p className="mt-2 text-sm text-destructive">{error}</p>
        <Button className="mt-6" render={<Link href="/ingresar" />}>
          Volver a ingresar
        </Button>
      </div>
    )
  }

  return (
    <p className="mx-auto max-w-sm px-6 py-16 text-center text-sm text-muted-foreground">
      Completando ingreso con Google…
    </p>
  )
}
