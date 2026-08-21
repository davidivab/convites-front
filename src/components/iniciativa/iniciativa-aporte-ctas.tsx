"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import { crearAporte, fetchMisAportes } from "@/lib/convites-api"
import { ApiError } from "@/lib/api"
import { rememberAuthNext } from "@/lib/auth-next"
import { saveAporteDraft } from "@/lib/aporte-draft"

/**
 * CTAs de aporte en el detalle: materiales → /aportar;
 * tiempo → modal de compromiso (con auth + return).
 */
export function IniciativaAporteCtas({
  slug,
  iniciativaId,
  fechaConvite,
}: {
  slug: string
  iniciativaId: number
  /** Fecha del convite (texto legible o ISO). */
  fechaConvite?: string | null
}) {
  const { token } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  /** Confirmó en esta sesión (para el mensaje de gracias). */
  const [justConfirmed, setJustConfirmed] = useState(false)
  /** Ya tiene asistencia confirmada (no cancelada) en este convite. */
  const [yaConfirmado, setYaConfirmado] = useState(false)

  const returnPath = `/iniciativa/${slug}?apoyar=tiempo`

  useEffect(() => {
    if (!token) {
      setYaConfirmado(false)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const aportes = await fetchMisAportes(token)
        if (cancelled) return
        const activo = aportes.some(
          (a) =>
            a.iniciativa?.id === iniciativaId &&
            a.asiste_al_convite &&
            a.estado !== "cancelado",
        )
        setYaConfirmado(activo)
      } catch {
        if (!cancelled) setYaConfirmado(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, iniciativaId])

  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    if (params.get("apoyar") === "tiempo") {
      setOpen(true)
      // Limpia query sin recargar
      const url = new URL(window.location.href)
      url.searchParams.delete("apoyar")
      window.history.replaceState({}, "", url.pathname + url.search)
    }
  }, [])

  function goAuth() {
    rememberAuthNext(returnPath)
    saveAporteDraft(slug, {
      cantidades: {},
      asisto: true,
      anonimo: false,
      puntoAcopioId: "",
      comproDeProveedor: false,
      proveedorId: "",
      fechaEntrega: "",
      openCompromiso: true,
      modoTiempo: true,
    })
    router.push(
      `/ingresar?next=${encodeURIComponent(returnPath)}`,
    )
  }

  async function confirmarTiempo() {
    if (!token) {
      goAuth()
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await crearAporte(token, iniciativaId, {
        asiste_al_convite: true,
        anonimo: false,
        items: [],
      })
      setYaConfirmado(true)
      setJustConfirmed(true)
      setDone(true)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos confirmar tu asistencia."
          : "No pudimos confirmar tu asistencia.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  function openTiempoModal() {
    setError(null)
    setJustConfirmed(false)
    setDone(yaConfirmado)
    setOpen(true)
  }

  const mostrarConfirmado = done || yaConfirmado

  return (
    <>
      <div className="mt-5 flex flex-col gap-2.5">
        <Button
          size="lg"
          className="h-12 w-full text-base"
          render={<Link href={`/iniciativa/${slug}/aportar`} />}
        >
          Me sumo llevando algo
        </Button>
        <Button
          type="button"
          variant={yaConfirmado ? "outline" : "secondary"}
          size="lg"
          className="h-11 w-full text-base"
          onClick={openTiempoModal}
        >
          {yaConfirmado
            ? "Ya estás confirmado para venir al convite"
            : "Puedo apoyar con mi tiempo"}
        </Button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tiempo-titulo"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-lg">
            {mostrarConfirmado ? (
              <>
                <h2
                  id="tiempo-titulo"
                  className="font-serif text-xl font-semibold text-foreground"
                >
                  {justConfirmed
                    ? "¡Gracias por sumarte!"
                    : "Ya estás confirmado"}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {justConfirmed
                    ? "Confirmamos tu asistencia. El organizador ya puede contar contigo el día del convite. Te enviamos un correo con el detalle."
                    : "El organizador ya cuenta contigo para venir al convite. Si no puedes, cancela a tiempo desde tu panel."}
                </p>
                {fechaConvite ? (
                  <p className="mt-3 text-sm text-foreground">
                    <span className="text-muted-foreground">Fecha: </span>
                    <span className="font-medium">{fechaConvite}</span>
                  </p>
                ) : null}
                <div className="mt-6 flex justify-end">
                  <Button type="button" onClick={() => setOpen(false)}>
                    Cerrar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2
                  id="tiempo-titulo"
                  className="font-serif text-xl font-semibold text-foreground"
                >
                  Apoyar con tu tiempo
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Al confirmar, te comprometes a asistir al convite y aportar
                  tu trabajo el día acordado. El organizador contará contigo.
                  Si no puedes, cancela a tiempo desde tu panel.
                </p>
                {fechaConvite ? (
                  <p className="mt-3 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground">
                    <span className="text-muted-foreground">Fecha del convite: </span>
                    <span className="font-medium">{fechaConvite}</span>
                  </p>
                ) : null}
                {!token ? (
                  <p className="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    Primero crea tu cuenta o ingresa; te devolvemos aquí para
                    confirmar.
                  </p>
                ) : null}
                {error ? (
                  <p className="mt-3 text-sm text-destructive">{error}</p>
                ) : null}
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={submitting}
                    onClick={() => setOpen(false)}
                  >
                    Ahora no
                  </Button>
                  <Button
                    type="button"
                    disabled={submitting}
                    onClick={() => void confirmarTiempo()}
                  >
                    {!token
                      ? "Ingresar y confirmar"
                      : submitting
                        ? "Confirmando…"
                        : "Sí, me comprometo"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}
