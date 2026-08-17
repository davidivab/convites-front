import type { Metadata } from "next"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { fetchProfesionales } from "@/lib/convites-api"
import type { Profesional } from "@/lib/data"
import { ProfesionalesClient } from "./profesionales-client"

export const metadata: Metadata = {
  title: "Manos profesionales — Convites",
  description:
    "Profesionales voluntarios que ofrecen apoyo psicológico, legal, de arquitectura y nutrición de forma gratuita.",
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
      <SiteHeader />
      <main className="flex-1">
        <ProfesionalesClient profesionales={profesionales} />
      </main>
      <SiteFooter />
    </div>
  )
}
