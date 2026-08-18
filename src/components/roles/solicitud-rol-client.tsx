"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MunicipiosMultiSelect } from "@/components/ui/municipios-multi-select"
import { useRequireRoleTree } from "@/hooks/use-require-role-tree"
import { ApiError } from "@/lib/api"
import {
  crearSolicitudRol,
  fetchMisSolicitudesRol,
  type ApiSolicitudRol,
  type RolSolicitable,
} from "@/lib/convites-api"
import {
  hasModeratorRole,
  hasVoluntarioRole,
  perfilTabsForRole,
} from "@/lib/role-tree"
import { RolIntroColumnas } from "@/components/roles/rol-intro-columnas"

const COPY: Record<
  RolSolicitable,
  {
    title: string
    subtitle: string
    porQueTitulo: string
    porQue: string[]
    funcionesTitulo: string
    funciones: string[]
    yaActivoHref?: string
  }
> = {
  moderador: {
    title: "Ser moderador",
    subtitle:
      "Los moderadores cuidan que los convites de su territorio sean reales, claros y seguros para quien aporta.",
    porQueTitulo: "¿Por qué necesitamos moderadores?",
    porQue: [
      "Cuando alguien abre un convite, la comunidad confía en que es serio: que hay un lugar, una necesidad y personas que responden.",
      "Los moderadores son vecinos que conocen su municipio y ayudan a revisar eso con calma, con respeto y con criterio. No son jueces: son un puente para que la ayuda llegue bien y nadie se sienta solo en el proceso.",
      "Sin esa mirada cercana, es más fácil que se cuelen errores o pedidos confusos. Con ella, la plataforma se siente más humana y confiable para todos.",
    ],
    funcionesTitulo: "Qué hace un moderador",
    funciones: [
      "Revisar iniciativas en la cola de moderación de tus municipios",
      "Aprobar, rechazar o pedir cambios con una nota clara y amable",
      "Apoyar la recepción de aportes cuando el organizador lo necesite",
    ],
    yaActivoHref: "/moderacion",
  },
  voluntario: {
    title: "Ser voluntario territorial",
    subtitle:
      "Los voluntarios acompañan el territorio: visibilizan convites locales y ayudan en lo logístico, sin moderar.",
    porQueTitulo: "¿Por qué necesitamos voluntarios?",
    porQue: [
      "Hay convites que necesitan más que una pantalla: alguien que conozca las veredas, que sepa a quién llamar y que anime a la gente a sumarse.",
      "Los voluntarios territoriales son esa presencia cercana. No aprueban ni rechazan proyectos: acompañan, difunden y conectan, para que la ayuda no se quede solo en el papel.",
      "Si te mueves en tu municipio y quieres poner el hombro sin cargar la responsabilidad de moderar, este rol es para ti.",
    ],
    funcionesTitulo: "Qué hace un voluntario",
    funciones: [
      "Ver y orientar convites de tus municipios asignados",
      "Apoyar difusión y coordinación en campo",
      "Sin permiso de aprobar o rechazar iniciativas (eso es del moderador)",
    ],
  },
}

export function SolicitudRolClient({ rol }: { rol: RolSolicitable }) {
  const path = `/panel/roles/${rol}`
  const { user, token, loading: authLoading } = useRequireRoleTree(path, [
    "aportante",
    "moderador",
    "profesional",
  ])
  const copy = COPY[rol]
  const yaTieneRol =
    rol === "moderador" ? hasModeratorRole(user) : hasVoluntarioRole(user)

  const [solicitudes, setSolicitudes] = useState<ApiSolicitudRol[]>([])
  const [loading, setLoading] = useState(true)
  const [apiReady, setApiReady] = useState(true)
  const [municipioIds, setMunicipioIds] = useState<number[]>([])
  const [mensaje, setMensaje] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const all = await fetchMisSolicitudesRol(token)
      setSolicitudes(all.filter((s) => s.rol === rol))
      setApiReady(true)
    } catch (err) {
      setSolicitudes([])
      // P46 aún no desplegado
      if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
        setApiReady(false)
      } else {
        setError(
          err instanceof ApiError
            ? err.body.message || "No pudimos cargar tus solicitudes."
            : "No pudimos cargar tus solicitudes.",
        )
      }
    } finally {
      setLoading(false)
    }
  }, [token, rol])

  useEffect(() => {
    if (authLoading || !token) return
    void load()
  }, [authLoading, token, load])

  const pendiente = solicitudes.find((s) => s.estado === "pendiente")
  const ultimaRechazada = [...solicitudes]
    .reverse()
    .find((s) => s.estado === "rechazada")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token || submitting || municipioIds.length === 0 || yaTieneRol) return
    setSubmitting(true)
    setError(null)
    setOk(false)
    try {
      await crearSolicitudRol(token, {
        rol,
        municipio_ids: municipioIds,
        mensaje: mensaje.trim() || undefined,
      })
      setMensaje("")
      setMunicipioIds([])
      setOk(true)
      await load()
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos enviar la solicitud."
          : "No pudimos enviar la solicitud.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  const tabs = perfilTabsForRole(user, path)

  if (authLoading || (!token && loading)) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-muted-foreground">
        Cargando…
      </div>
    )
  }

  if (!token || !user) return null

  return (
    <DashboardShell title={copy.title} subtitle={copy.subtitle} tabs={tabs}>
      <RolIntroColumnas
        porQueTitulo={copy.porQueTitulo}
        porQue={copy.porQue}
        funcionesTitulo={copy.funcionesTitulo}
        funciones={copy.funciones}
      />

      {!apiReady ? (
        <p className="mb-6 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          No pudimos hablar con el API de solicitudes. Revisa que el backend esté
          arriba y vuelve a intentar.
        </p>
      ) : null}

      {yaTieneRol ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
          <p className="font-medium text-foreground">
            Ya tienes el rol de {rol === "moderador" ? "moderador" : "voluntario"}{" "}
            activo.
          </p>
          {copy.yaActivoHref ? (
            <Button className="mt-4" render={<Link href={copy.yaActivoHref} />}>
              Ir al panel de moderación
            </Button>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Tus municipios asignados aparecen en tus paneles de Ayudas y
              Convites.
            </p>
          )}
        </div>
      ) : pendiente ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="font-medium text-foreground">Solicitud en revisión</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Enviada
            {pendiente.created_at
              ? ` el ${new Date(pendiente.created_at).toLocaleDateString("es-CO")}`
              : ""}
            . Municipios:{" "}
            {pendiente.municipios.map((m) => m.nombre).join(", ") || "—"}.
          </p>
        </div>
      ) : (
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="space-y-5 rounded-xl border border-border bg-card p-5 md:p-6"
        >
          <h2 className="font-serif text-xl text-foreground">
            Solicitar rol
          </h2>
          {ultimaRechazada ? (
            <p className="text-sm text-muted-foreground">
              Tu solicitud anterior fue rechazada
              {ultimaRechazada.nota_revision
                ? `: “${ultimaRechazada.nota_revision}”`
                : "."}{" "}
              Puedes enviar una nueva.
            </p>
          ) : null}
          <MunicipiosMultiSelect
            value={municipioIds}
            onChange={setMunicipioIds}
          />
          <div className="space-y-2">
            <Label htmlFor={`msg-${rol}`}>Mensaje (opcional)</Label>
            <Textarea
              id={`msg-${rol}`}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={3}
              placeholder="Cuéntanos por qué quieres este rol y en qué zona te mueves…"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {ok ? (
            <p className="text-sm text-primary">Solicitud enviada. Te avisamos al revisarla.</p>
          ) : null}
          <Button
            type="submit"
            disabled={
              !apiReady || submitting || municipioIds.length === 0
            }
          >
            {submitting ? "Enviando…" : "Enviar solicitud"}
          </Button>
        </form>
      )}
    </DashboardShell>
  )
}
