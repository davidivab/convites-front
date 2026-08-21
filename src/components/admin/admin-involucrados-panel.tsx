"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiErrorMessage } from "@/lib/api"
import {
  asignarAdminCreador,
  type ApiAdminCreador,
  type ApiAdminIniciativaDetalle,
} from "@/lib/convites-api"

/**
 * Pestaña admin: creador del convite + reasignar por correo.
 * El modal se porta a document.body para no anidar forms (el editor padre
 * tiene un <form> que capturaba el submit y recargaba).
 */
export function AdminInvolucradosPanel({
  token,
  slug,
  creador,
  onCreadorChange,
}: {
  token: string
  slug: string
  creador: ApiAdminCreador | null
  onCreadorChange: (detalle: ApiAdminIniciativaDetalle) => void
}) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const municipioLabel = creador?.municipio
    ? creador.municipio.departamento
      ? `${creador.municipio.nombre}, ${creador.municipio.departamento.nombre}`
      : creador.municipio.nombre
    : null

  async function confirmarAsignacion() {
    if (submitting || !email.trim()) return
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await asignarAdminCreador(token, slug, email.trim())
      onCreadorChange(updated)
      setOpen(false)
      setEmail("")
      setSuccess(
        `Convite asignado a ${updated.creador?.name ?? "el nuevo usuario"}. Le enviamos un correo de aviso.`,
      )
    } catch (err) {
      setError(apiErrorMessage(err, "No pudimos reasignar el creador."))
    } finally {
      setSubmitting(false)
    }
  }

  const modal =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 p-4 sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="asignar-creador-titulo"
            onClick={(e) => {
              if (e.target === e.currentTarget && !submitting) setOpen(false)
            }}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="asignar-creador-titulo"
                className="font-serif text-xl font-semibold text-foreground"
              >
                Asignar a otro usuario
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Escribe el correo de un ciudadano registrado que pueda crear
                convites. Le enviaremos un aviso por correo.
              </p>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nuevo-creador-email">Correo del ciudadano</Label>
                  <Input
                    id="nuevo-creador-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        void confirmarAsignacion()
                      }
                    }}
                    placeholder="ciudadano@correo.com"
                    disabled={submitting}
                  />
                </div>
                {error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={submitting}
                    onClick={() => setOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    disabled={submitting || !email.trim()}
                    onClick={() => void confirmarAsignacion()}
                  >
                    {submitting ? "Asignando…" : "Confirmar asignación"}
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <div className="max-w-xl space-y-4">
      <p className="text-sm text-muted-foreground">
        Personas responsables del convite. Desde aquí puedes reasignar el
        creador a otro ciudadano registrado.
      </p>

      {success ? (
        <p
          className="rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-foreground"
          role="status"
        >
          {success}
        </p>
      ) : null}

      {error && !open ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Creador del convite
        </p>
        {creador ? (
          <>
            <h3 className="mt-2 font-serif text-xl font-semibold text-foreground">
              {creador.name}
            </h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-muted-foreground">Correo</dt>
                <dd className="font-medium text-foreground">
                  {creador.email || "—"}
                </dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-muted-foreground">Celular</dt>
                <dd className="font-medium text-foreground">
                  {creador.celular || "—"}
                </dd>
              </div>
              {creador.barrio ? (
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-muted-foreground">Barrio</dt>
                  <dd className="font-medium text-foreground">{creador.barrio}</dd>
                </div>
              ) : null}
              {municipioLabel ? (
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-muted-foreground">Municipio</dt>
                  <dd className="font-medium text-foreground">{municipioLabel}</dd>
                </div>
              ) : null}
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => {
                  setError(null)
                  setSuccess(null)
                  setEmail("")
                  setOpen(true)
                }}
              >
                Asignar a otro usuario
              </Button>
              <Button
                type="button"
                variant="outline"
                render={<Link href={`/admin/usuarios/${creador.id}`} />}
              >
                Ver perfil
              </Button>
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No hay creador asociado a este convite.
          </p>
        )}
      </div>

      {modal}
    </div>
  )
}
