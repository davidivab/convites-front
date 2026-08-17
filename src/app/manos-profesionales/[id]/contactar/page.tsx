import { notFound } from "next/navigation"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { fetchProfesional } from "@/lib/convites-api"
import { ContactarClient } from "./contactar-client"

export default async function ContactarProfesionalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let profesional
  try {
    profesional = await fetchProfesional(id, { server: true })
  } catch {
    notFound()
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <ContactarClient profesional={profesional} />
      </main>
      <SiteFooter />
    </div>
  )
}
