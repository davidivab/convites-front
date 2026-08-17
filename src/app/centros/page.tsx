import type { Metadata } from "next"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { fetchCentros } from "@/lib/convites-api"
import type { Centro } from "@/lib/data"
import { CentrosClient } from "./centros-client"

export const metadata: Metadata = {
  title: "Centros de interés — Convites",
  description:
    "Directorio de centros de acopio, albergues, hospitales, bomberos y líneas de emergencia en Risaralda.",
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
      <SiteHeader />
      <main className="flex-1">
        <CentrosClient centros={centros} />
      </main>
      <SiteFooter />
    </div>
  )
}
