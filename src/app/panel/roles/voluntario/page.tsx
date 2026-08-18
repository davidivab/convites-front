import type { Metadata } from "next"
import { SolicitudRolClient } from "@/components/roles/solicitud-rol-client"

export const metadata: Metadata = {
  title: "Solicitar rol de voluntario — Convites",
  description:
    "Solicita ser voluntario territorial en tus municipios. Un administrador revisará tu solicitud.",
}

export default function Page() {
  return <SolicitudRolClient rol="voluntario" />
}
