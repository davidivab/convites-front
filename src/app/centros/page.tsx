import type { Metadata } from "next"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { JsonLd } from "@/components/seo/json-ld"
import { fetchCentros } from "@/lib/convites-api"
import type { Centro } from "@/lib/data"
import { buildCentrosJsonLd } from "@/lib/seo/json-ld"
import { CentrosClient } from "./centros-client"

export const metadata: Metadata = {
  title: "Lugares de ayuda en Colombia",
  description:
    "Directorio de lugares de ayuda: centros de acopio, albergues, hospitales, bomberos, policía y líneas de emergencia en Colombia.",
  alternates: { canonical: "/centros" },
  openGraph: {
    title: "Lugares de ayuda en Colombia · Convites",
    description:
      "Encuentra acopio, albergues, hospitales y servicios de emergencia cerca de ti.",
  },
}

export const revalidate = 120

export default async function CentrosPage() {
  let centros: Centro[] = []
  try {
    centros = await fetchCentros(true)
  } catch {
    centros = []
  }

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd data={buildCentrosJsonLd(centros)} />
      <SiteHeader />
      <main className="flex-1">
        <CentrosClient centros={centros} />
      </main>
      <SiteFooter />
    </div>
  )
}
