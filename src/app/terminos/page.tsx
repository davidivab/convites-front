import type { Metadata } from "next"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { Info } from "lucide-react"

export const metadata: Metadata = {
  title: "Reglas y términos — Convites",
  description:
    "Las reglas de Convites: ayuda en especie, revisión previa y manejo transparente del dinero por fuera de la plataforma.",
}

const secciones = [
  {
    titulo: "1. Qué es Convites",
    parrafos: [
      "Convites es un espacio para organizar ayuda comunitaria en especie: materiales, insumos, alimentos y trabajo voluntario. No somos una plataforma de recaudo de dinero ni intermediamos pagos.",
      "La plataforma se ofrece tal cual, como una herramienta para que las comunidades coordinen sus convites.",
    ],
  },
  {
    titulo: "2. Ayuda en especie, no en efectivo",
    parrafos: [
      "Los aportes que se registran en Convites son bienes o tiempo: nunca dinero. Cuando un proyecto necesite fondos, el organizador puede enlazar una plataforma externa de recaudo (como Vaki o una cuenta transparente), y ese manejo queda por completo fuera de nuestra responsabilidad.",
      "Nunca pidas ni entregues dinero a través de mensajes privados dentro o alrededor de un convite.",
    ],
  },
  {
    titulo: "3. Revisión de convites",
    parrafos: [
      "Todo convite pasa por revisión antes de publicarse. Podemos pedir información adicional, contactar a la junta o colectivo que lo propone, o rechazar convites que no cumplan estas reglas.",
      "Rechazamos convites que no sean verificables, que promuevan intereses particulares o que usen la plataforma para recaudar dinero de forma directa.",
    ],
  },
  {
    titulo: "4. Responsabilidad de los organizadores",
    parrafos: [
      "Quien abre un convite es responsable de que la información sea veraz, de recibir y usar los aportes para lo que se indicó, y de rendir cuentas a su comunidad.",
      "Convites no garantiza el resultado de ningún convite ni se hace responsable por acuerdos entre las partes.",
    ],
  },
  {
    titulo: "5. Datos personales y veracidad de la información",
    parrafos: [
      "Recogemos solo los datos necesarios para coordinar los convites. No vendemos ni compartimos tu información con terceros con fines comerciales.",
      "Cada persona es la única responsable por la información y los datos que entrega a través de la plataforma. Al registrarte y usar Convites, declaras que los datos que proporcionas son veraces, actuales y de tu propiedad o entregados con autorización, y asumes las consecuencias de cualquier dato falso, inexacto o de terceros compartido sin consentimiento.",
    ],
  },
  {
    titulo: "6. Exención de responsabilidad",
    parrafos: [
      "Convites es únicamente una herramienta que facilita el contacto y la coordinación entre personas y comunidades. La plataforma y su desarrollador no son parte de los acuerdos, encuentros, aportes, trabajos ni servicios que se pacten a través de ella.",
      "En la máxima medida permitida por la ley, tanto la plataforma Convites como su desarrollador quedan liberados de toda responsabilidad por daños, pérdidas, lesiones, perjuicios, incumplimientos o conflictos —directos o indirectos— que surjan del uso de la plataforma, de la información publicada por los usuarios, de los datos entregados, o de las relaciones y actividades coordinadas entre las partes.",
      "La plataforma se ofrece \"tal cual\" y \"según disponibilidad\", sin garantías de ningún tipo. Cada usuario actúa bajo su propio criterio y riesgo, y es responsable de verificar la identidad, idoneidad y buena fe de las personas con quienes interactúa antes de comprometer bienes, tiempo o datos.",
    ],
  },
  {
    titulo: "7. Aceptación",
    parrafos: [
      "El uso de la plataforma y el registro de una cuenta implican la aceptación plena de estas reglas y de esta exención de responsabilidad. Si no estás de acuerdo con alguno de estos términos, por favor no uses Convites.",
    ],
  },
]

export default function TerminosPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-16 md:py-24">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">
            Reglas y términos
          </p>
          <h1 className="mt-3 text-balance font-serif text-4xl leading-tight text-foreground">
            Las reglas que nos mantienen honestos
          </h1>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            Convites funciona porque la comunidad confía. Estas reglas existen
            para proteger esa confianza. Última actualización: septiembre de 2026.
          </p>

          <div className="mt-8 rounded-2xl border border-border bg-muted/40 p-4">
            <div className="flex items-start gap-2.5">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-sm leading-relaxed text-foreground/80">
                <span className="font-medium text-foreground">
                  Convites no recibe ni administra dinero.
                </span>{" "}
                Toda la ayuda que se coordina aquí es en especie o en trabajo. El
                dinero, cuando hace falta, se maneja por fuera y de forma
                transparente.
              </p>
            </div>
          </div>

          <div className="mt-10 space-y-10">
            {secciones.map((s) => (
              <section key={s.titulo}>
                <h2 className="font-serif text-xl text-foreground">{s.titulo}</h2>
                <div className="mt-3 space-y-3">
                  {s.parrafos.map((p, idx) => (
                    <p
                      key={idx}
                      className="text-pretty leading-relaxed text-foreground/80"
                    >
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
