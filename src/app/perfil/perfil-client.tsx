"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { DashboardShell, StatTile } from "@/components/layout/dashboard-shell"
import { PerfilEditor } from "@/components/perfil/perfil-editor"
import { useRequireRoleTree } from "@/hooks/use-require-role-tree"
import { fetchMisAportes } from "@/lib/convites-api"
import type { ApiAporte } from "@/lib/types"
import { HandHeart, CalendarCheck, MapPin, Award } from "lucide-react"

function formatFecha(value: string | null | undefined): string {
  if (!value) return "—"
  try {
    return new Date(value).toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return value
  }
}

function formatAporte(aporte: ApiAporte): string {
  if (!aporte.items?.length) {
    return aporte.asiste_al_convite ? "Asistencia al convite" : "Sin ítems"
  }
  return aporte.items
    .map((it) => `${it.cantidad}${it.unidad ? ` ${it.unidad}` : ""} ${it.nombre || "Ítem"}`)
    .join(", ")
}

export function PerfilClient() {
  const { user, token, loading: authLoading, hasPermission } = useRequireRoleTree(
    "/perfil",
    "aportante",
  )
  const [aportes, setAportes] = useState<ApiAporte[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading || !token) return
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const data = await fetchMisAportes(token!)
        if (!cancelled) setAportes(data)
      } catch {
        if (!cancelled) setAportes([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [authLoading, token])

  const historial = useMemo(
    () =>
      aportes.filter(
        (a) => a.estado === "cumplido" || a.estado === "cancelado" || a.estado === "confirmado",
      ),
    [aportes],
  )

  const activos = useMemo(
    () => aportes.filter((a) => a.estado === "confirmado" || a.estado === "cumplido"),
    [aportes],
  )

  const asistencias = useMemo(
    () => activos.filter((a) => a.asiste_al_convite).length,
    [activos],
  )

  const inicial =
    user?.name?.trim()?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "?"

  const tabs = [
    { href: "/panel/aportante", label: "Aportante" },
    { href: "/panel/creador", label: "Organizador" },
    { href: "/perfil", label: "Perfil", active: true },
    ...(hasPermission("iniciativas.moderate")
      ? [{ href: "/moderacion", label: "Moderación" }]
      : []),
  ]

  if (authLoading || (!token && loading)) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-muted-foreground">
        Cargando tu perfil…
      </div>
    )
  }

  if (!token || !user) return null

  return (
    <DashboardShell
      title="Mi perfil"
      subtitle="Tus datos y el rastro de todo lo que has aportado a la comunidad."
      tabs={tabs}
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="order-2 lg:order-1">
          <PerfilEditor user={user} token={token} />

          <section className="mt-6 rounded-xl border border-border bg-card p-6">
            <h2 className="font-serif text-xl text-foreground">
              Tus aportes recientes
            </h2>
            {loading ? (
              <p className="mt-4 text-sm text-muted-foreground">Cargando…</p>
            ) : historial.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Aún no tienes aportes.{" "}
                <Link href="/explorar" className="underline underline-offset-2">
                  Explora convites
                </Link>
                .
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {historial.slice(0, 8).map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {a.iniciativa?.titulo || "Convite"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatAporte(a)}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-xs uppercase tracking-wide text-muted-foreground">
                      {formatFecha(a.confirmado_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="order-1 space-y-4 lg:order-2">
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">
              {inicial}
            </div>
            <div className="min-w-0">
              <p className="truncate font-serif text-lg text-foreground">
                {user.name}
              </p>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {user.roles.join(" · ") || "member"}
              </p>
            </div>
          </div>

          <StatTile
            label="Convites apoyados"
            value={String(activos.length)}
            hint="Aportes activos o cumplidos"
            icon={<HandHeart className="h-5 w-5" />}
          />
          <StatTile
            label="Asistencias"
            value={String(asistencias)}
            hint="Marcaste que vas al convite"
            icon={<CalendarCheck className="h-5 w-5" />}
          />

          <div className="rounded-xl border border-border bg-accent/10 p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/20 text-accent-foreground">
              <Award className="h-5 w-5" />
            </div>
            <p className="mt-3 font-serif text-lg text-foreground">Comunidad</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Cada aporte en especie o asistencia cuenta. Gracias por sostener la
              costumbre del convite.
            </p>
          </div>
        </aside>
      </div>
    </DashboardShell>
  )
}
