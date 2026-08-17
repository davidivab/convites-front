import type { Metadata } from "next"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { RegistroProfesionalClient } from "./registro-profesional-client"

export const metadata: Metadata = {
  title: "Registro de profesional | Convites",
  description:
    "Regístrate como profesional voluntario. Verificamos tu título y certificados para que la comunidad confíe en tus manos.",
}

export default function RegistroProfesionalPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <RegistroProfesionalClient />
      </main>
      <SiteFooter />
    </div>
  )
}
