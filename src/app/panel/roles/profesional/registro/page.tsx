import type { Metadata } from "next"
import { RegistroProfesionalFormClient } from "./registro-profesional-form-client"

export const metadata: Metadata = {
  title: "Registro profesional — Convites",
  description:
    "Completa tu solicitud de perfil profesional voluntario. Verificamos título y certificados.",
}

export default function Page() {
  return <RegistroProfesionalFormClient />
}
