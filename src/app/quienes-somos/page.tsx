import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { Button } from "@/components/ui/button"
import { HandHeart, Users, ShieldCheck, Sprout } from "lucide-react"

export const metadata: Metadata = {
  title: "Quiénes somos — Convites",
  description:
    "Convites nace de una costumbre del campo colombiano: reunirse a trabajar por el vecino. Aquí la contamos en digital.",
}

const valores = [
  {
    icon: HandHeart,
    titulo: "Ayuda en especie, no en efectivo",
    texto:
      "Aquí se aportan cosas concretas —tejas, cemento, comida, tiempo— o se acompaña el convite. La plata, cuando hace falta, se maneja por fuera y con transparencia.",
  },
  {
    icon: ShieldCheck,
    titulo: "Todo pasa por revisión",
    texto:
      "Cada convite lo revisa una persona antes de publicarse. Verificamos que sea real y que la comunidad lo respalde.",
  },
  {
    icon: Users,
    titulo: "La comunidad al centro",
    texto:
      "Los convites los abren juntas de acción comunal, colectivos y vecinos. Nosotros solo ponemos la herramienta.",
  },
  {
    icon: Sprout,
    titulo: "Una costumbre que sigue viva",
    texto:
      "El convite, la minga, la mano vuelta: distintos nombres para lo mismo. Trabajar juntos por el que lo necesita.",
  },
]

export default function QuienesSomosPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 pt-16 pb-10 md:pt-24">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">
            Quiénes somos
          </p>
          <h1 className="mt-3 text-balance font-serif text-4xl leading-tight text-foreground md:text-5xl">
            Una vieja costumbre del campo, ahora en digital
          </h1>
          <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">
            En los pueblos de Colombia, cuando a alguien se le caía el techo, el
            barrio entero se juntaba un sábado a levantarlo. Cada quien llevaba
            lo que tenía: unas tejas, un bulto de cemento, el almuerzo. Eso es un
            convite. Convites solo lo lleva a la pantalla para que sea más fácil
            organizarlo y saber qué falta.
          </p>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-12">
          <div className="overflow-hidden rounded-2xl border border-border">
            <Image
              src="/images/hero-convite.png"
              alt="Vecinos de una vereda de Colombia trabajando juntos en la reconstrucción de una casa durante un convite"
              width={1200}
              height={600}
              className="h-auto w-full object-cover"
            />
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-16">
          <div className="grid gap-4 md:grid-cols-2">
            {valores.map((v) => (
              <div
                key={v.titulo}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <v.icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 font-serif text-xl text-foreground">
                  {v.titulo}
                </h2>
                <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
                  {v.texto}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-24">
          <div className="flex flex-col items-start gap-6 rounded-2xl bg-primary px-6 py-10 text-primary-foreground md:flex-row md:items-center md:justify-between md:px-12">
            <div className="max-w-xl">
              <h2 className="text-balance font-serif text-2xl md:text-3xl">
                ¿Tu barrio o vereda necesita un convite?
              </h2>
              <p className="mt-2 text-pretty leading-relaxed text-primary-foreground/80">
                Cuenta qué pasó y qué falta. Lo revisamos y lo hacemos llegar a
                más gente.
              </p>
            </div>
            <Button
              size="lg"
              variant="secondary"
              render={<Link href="/crear" />}
              className="shrink-0"
            >
              Crear un convite
            </Button>
          </div>

          <div className="mt-10 border-t border-border pt-6">
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
              Convites fue desarrollada por{" "}
              <span className="font-medium text-foreground">David Castillo</span>,
              apasionado por la tecnología y la cooperación social, con la idea de
              poner herramientas digitales al servicio de las comunidades.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
              <a
                href="https://instagram.com/_davidivab_"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
                @_davidivab_
              </a>
              <a
                href="https://linkedin.com/in/davidarmando"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
                linkedin.com/in/davidarmando
              </a>
              <a
                href="https://github.com/davidivab"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 4 5 4 5 4c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 11c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
                github.com/davidivab
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
