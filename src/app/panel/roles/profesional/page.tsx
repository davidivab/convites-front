import type { Metadata } from "next"
import { SolicitudProfesionalClient } from "./solicitud-profesional-client"

export const metadata: Metadata = {
  title: "Solicitar perfil profesional — Convites",
  description:
    "Solicita publicar tu perfil como profesional voluntario. Un administrador lo revisará.",
}

export default function Page() {
  return <SolicitudProfesionalClient />
}
