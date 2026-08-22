import type { Metadata } from "next"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { JsonLd } from "@/components/seo/json-ld"
import { fetchProfesionales } from "@/lib/convites-api"
import type { Profesional } from "@/lib/data"
import { buildProfesionalesJsonLd } from "@/lib/seo/json-ld"
import { ProfesionalesClient } from "./profesionales-client"

export const metadata: Metadata = {
  title: "Manos profesionales voluntarias",
  description:
    "Profesionales voluntarios en Colombia: apoyo psicológico, legal, arquitectura, nutrición y salud sin costo para quienes lo necesitan tras una emergencia.",
  alternates: { canonical: "/manos-profesionales" },
  openGraph: {
    title: "Manos profesionales voluntarias · Convites",
    description:
      "Contacta profesionales que donan su conocimiento: psicología, legal, estructuras, nutrición y salud.",
  },
}

export const revalidate = 120

export default async function ProfesionalesPage() {
  let profesionales: Profesional[] = []
  try {
    profesionales = await fetchProfesionales(true)
  } catch {
    profesionales = []
  }

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd data={buildProfesionalesJsonLd(profesionales)} />
      <SiteHeader />
      <main className="flex-1">
        <ProfesionalesClient profesionales={profesionales} />
      </main>
      <SiteFooter />
    </div>
  )
}
