import type { Metadata } from "next"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { ShieldAlert } from "lucide-react"

export const metadata: Metadata = {
  title: "Descargo de responsabilidad — Convites",
  description:
    "Convites y su desarrollador quedan liberados de responsabilidad. Cada persona es responsable de los datos que entrega y de los acuerdos que pacta.",
}

const secciones = [
  {
    titulo: "1. Convites es solo una herramienta",
    parrafos: [
      "Convites es una plataforma que facilita el contacto y la coordinación entre personas y comunidades. No somos una fundación, no prestamos servicios profesionales y no somos parte de ningún acuerdo, encuentro, aporte, trabajo o servicio que se pacte a través de la plataforma.",
    ],
  },
  {
    titulo: "2. Liberación de responsabilidad",
    parrafos: [
      "En la máxima medida permitida por la ley, tanto la plataforma Convites como su desarrollador quedan liberados de toda responsabilidad por daños, pérdidas, lesiones, perjuicios, incumplimientos, estafas o conflictos —directos o indirectos— que surjan del uso de la plataforma, de la información publicada, de los datos entregados o de las relaciones y actividades coordinadas entre las partes.",
      "Ni la plataforma ni su desarrollador responden por la conducta de los usuarios, por la calidad o resultado de los trabajos y aportes, ni por el cumplimiento de los compromisos que las personas asuman entre sí.",
    ],
  },
  {
    titulo: "3. Responsabilidad sobre los datos",
    parrafos: [
      "Cada persona es la única responsable por la información y los datos que entrega a través de la plataforma. Al usar Convites, declaras que los datos que proporcionas son veraces, actuales y de tu propiedad o entregados con autorización, y asumes las consecuencias de cualquier dato falso, inexacto o de terceros compartido sin consentimiento.",
    ],
  },
  {
    titulo: "4. Uso bajo tu propio riesgo",
    parrafos: [
      "La plataforma se ofrece \"tal cual\" y \"según disponibilidad\", sin garantías de ningún tipo. Cada usuario actúa bajo su propio criterio y riesgo, y es responsable de verificar la identidad, idoneidad y buena fe de las personas con quienes interactúa antes de comprometer bienes, tiempo, datos o su integridad.",
      "Recomendamos coordinar los encuentros en lugares seguros, con acompañamiento de líderes o entidades de confianza de la zona.",
    ],
  },
  {
    titulo: "5. Dinero por fuera de la plataforma",
    parrafos: [
      "Convites no recibe ni administra dinero. Cualquier manejo de fondos ocurre por fuera de la plataforma, entre las partes, y queda por completo fuera de nuestra responsabilidad.",
    ],
  },
  {
    titulo: "6. Aceptación",
    parrafos: [
      "El uso de la plataforma, el registro de una cuenta y la creación de un convite implican la aceptación plena de este descargo de responsabilidad. Si no estás de acuerdo, por favor no uses Convites.",
    ],
  },
]

export default function DescargoPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-16 md:py-24">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">
            Descargo de responsabilidad
          </p>
          <h1 className="mt-3 text-balance font-serif text-4xl leading-tight text-foreground">
            Cada quien responde por lo suyo
          </h1>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            Convites es una herramienta para coordinar ayuda comunitaria. Este
            documento aclara los límites de esa herramienta. Última
            actualización: septiembre de 2026.
          </p>

          <div className="mt-8 rounded-2xl border border-border bg-muted/40 p-4">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-sm leading-relaxed text-foreground/80">
                <span className="font-medium text-foreground">
                  La plataforma y su desarrollador no se hacen responsables.
                </span>{" "}
                Cada persona es responsable de los datos que entrega y de los
                acuerdos que pacta con otras personas.
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
