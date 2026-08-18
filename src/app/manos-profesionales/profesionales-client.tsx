"use client"

import { useState } from "react"
import Link from "next/link"
import {
  AREA_PROFESIONAL,
  type AreaProfesional,
  type Profesional,
} from "@/lib/data"
import { Button } from "@/components/ui/button"
import { PageIntroSection } from "@/components/layout/page-intro-section"
import {
  HeartPulse,
  Scale,
  Ruler,
  Apple,
  Stethoscope,
  MapPin,
  Clock,
  Monitor,
  HandHeart,
} from "lucide-react"
import { cn } from "@/lib/utils"

const AREA_ICON: Record<AreaProfesional, typeof HeartPulse> = {
  psicologia: HeartPulse,
  legal: Scale,
  arquitectura: Ruler,
  nutricion: Apple,
  salud: Stethoscope,
}

const ORDEN: AreaProfesional[] = [
  "psicologia",
  "legal",
  "arquitectura",
  "nutricion",
  "salud",
]

export function ProfesionalesClient({
  profesionales,
}: {
  profesionales: Profesional[]
}) {
  const [area, setArea] = useState<AreaProfesional | "todas">("todas")

  const lista =
    area === "todas"
      ? profesionales
      : profesionales.filter((p) => p.area === area)

  const areas = ORDEN.filter((a) => profesionales.some((p) => p.area === a))

  return (
    <>
      <PageIntroSection
        title="Manos profesionales"
        eyebrow="Voluntariado especializado"
        className="bg-secondary/40"
        description={
          <>
            Profesionales de la región que donan su conocimiento sin costo:
            acompañamiento psicológico, asesoría legal, evaluación de
            estructuras y planes de nutrición para quienes lo necesitan.
          </>
        }
      >
        <div className="flex flex-wrap gap-3">
          <Button size="lg" render={<Link href="/panel/roles/profesional/registro" />}>
            <HandHeart className="size-4" />
            Registrarme como profesional
          </Button>
          <Button
            size="lg"
            variant="outline"
            render={<Link href="/ingresar?next=/manos-profesionales" />}
          >
            Ya tengo cuenta
          </Button>
        </div>
        {process.env.NODE_ENV !== "production" ? (
          <p className="mt-4 max-w-xl text-xs text-muted-foreground">
            Demo:{" "}
            <code className="rounded bg-muted px-1">aportante1@convites.test</code>{" "}
            / password — perfil profesional vinculado (Laura Cardona). Panel
            propio del rol llega con API P29.
          </p>
        ) : null}
      </PageIntroSection>

      <section className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por área">
          <FilterChip active={area === "todas"} onClick={() => setArea("todas")}>
            Todas
          </FilterChip>
          {areas.map((a) => {
            const Icon = AREA_ICON[a]
            return (
              <FilterChip key={a} active={area === a} onClick={() => setArea(a)}>
                <Icon className="size-3.5" />
                {AREA_PROFESIONAL[a].label}
              </FilterChip>
            )
          })}
        </div>

        {area !== "todas" && (
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {AREA_PROFESIONAL[area].descripcion}
          </p>
        )}

        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {lista.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
              <p className="font-medium text-foreground">
                No hay profesionales publicados en este momento
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Si puedes ofrecer apoyo gratuito, regístrate para revisión del equipo.
              </p>
              <Button
                className="mt-5"
                render={<Link href="/panel/roles/profesional/registro" />}
              >
                Registrarme como profesional
              </Button>
            </div>
          ) : null}
          {lista.map((p) => {
            const Icon = AREA_ICON[p.area]
            return (
              <article
                key={p.id}
                className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex size-11 items-center justify-center rounded-full bg-primary/10 font-serif text-lg text-primary"
                    aria-hidden="true"
                  >
                    {p.inicial}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate font-serif text-lg text-foreground">
                      {p.nombre}
                    </h2>
                    <p className="truncate text-sm text-muted-foreground">{p.titulo}</p>
                  </div>
                </div>

                <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                  <Icon className="size-3.5" />
                  {AREA_PROFESIONAL[p.area].label}
                </span>

                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {p.descripcion}
                </p>

                <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 shrink-0 text-muted-foreground" />
                    <span className="text-foreground/80">{p.zona}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Monitor className="size-4 shrink-0 text-muted-foreground" />
                    <span className="text-foreground/80">{p.modalidad}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 shrink-0 text-muted-foreground" />
                    <span className="text-foreground/80">{p.disponibilidad}</span>
                  </div>
                </dl>

                <Button
                  variant="outline"
                  className="mt-5 w-full"
                  render={<Link href={`/manos-profesionales/${p.id}/contactar`} />}
                >
                  Solicitar contacto
                </Button>
              </article>
            )
          })}
        </div>
      </section>
    </>
  )
}

function FilterChip({
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
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}
