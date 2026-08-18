import type { Metadata } from "next"
import { SolicitudRolClient } from "@/components/roles/solicitud-rol-client"

export const metadata: Metadata = {
  title: "Solicitar rol de moderador — Convites",
  description:
    "Solicita ser moderador de convites en tus municipios. Un administrador revisará tu solicitud.",
}

export default function Page() {
  return <SolicitudRolClient rol="moderador" />
}
