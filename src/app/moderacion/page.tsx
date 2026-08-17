import type { Metadata } from "next"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { ModeracionClient } from "./moderacion-client"

export const metadata: Metadata = {
  title: "Moderación — Convites",
}

export default function ModeracionPage() {
  return (
    <DashboardShell
      title="Cola de moderación"
      subtitle="Revisamos cada convite antes de publicarlo. Verificamos que sea real, que la comunidad lo respalde y que no pida dinero por fuera de las reglas."
      tabs={[
        { href: "/panel/aportante", label: "Aportante" },
        { href: "/panel/creador", label: "Organizador" },
        { href: "/moderacion", label: "Moderación", active: true },
      ]}
    >
      <ModeracionClient />
    </DashboardShell>
  )
}
