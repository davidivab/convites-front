import Link from "next/link"
import { Handshake, MapPinned, Stethoscope } from "lucide-react"
import { cn } from "@/lib/utils"

const CTAS = [
  {
    href: "/crear",
    icon: Handshake,
    titulo: "Crear un convite",
    texto:
      "Cuenta qué falta en tu barrio o vereda y arma la lista entre vecinos.",
    cta: "Empezar mi convite",
    tone: {
      card: "border-primary/25 bg-primary/[0.06] hover:border-primary/45 hover:bg-primary/[0.1]",
      icon: "bg-primary/15 text-primary",
      button: "bg-primary text-primary-foreground hover:bg-primary/90",
    },
  },
  {
    href: "/manos-profesionales",
    icon: Stethoscope,
    titulo: "Ayuda profesional",
    texto:
      "Encuentra apoyo psicológico, legal, de arquitectura o nutrición.",
    cta: "Conocer profesionales",
    tone: {
      card: "border-accent/25 bg-accent/[0.07] hover:border-accent/45 hover:bg-accent/[0.12]",
      icon: "bg-accent/15 text-accent",
      button: "bg-accent text-accent-foreground hover:bg-accent/90",
    },
  },
  {
    href: "/centros",
    icon: MapPinned,
    titulo: "Lugares de ayuda",
    texto: "Albergues, puntos de acopio y centros cercanos a tu zona.",
    cta: "Ver lugares cerca",
    tone: {
      card: "border-warning/30 bg-warning/[0.12] hover:border-warning/50 hover:bg-warning/[0.18]",
      icon: "bg-warning/25 text-warning-foreground",
      button: "bg-warning text-warning-foreground hover:bg-warning/90",
    },
  },
] as const

export function HomeCtaCards() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 md:py-16">
      <div className="max-w-2xl">
        <h2 className="font-serif text-3xl font-semibold text-balance text-foreground md:text-4xl">
          Tres formas de sumar
        </h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Abre un convite, busca manos profesionales o ubica un lugar de ayuda
          cerca.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CTAS.map(({ href, icon: Icon, titulo, texto, cta, tone }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "group flex flex-col rounded-2xl border p-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              tone.card,
            )}
          >
            <span
              className={cn(
                "inline-flex size-11 items-center justify-center rounded-full",
                tone.icon,
              )}
            >
              <Icon className="size-5" aria-hidden />
            </span>
            <h3 className="mt-5 font-serif text-xl font-semibold text-foreground">
              {titulo}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              {texto}
            </p>
            <span
              className={cn(
                "mt-5 inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
                tone.button,
              )}
            >
              {cta}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
