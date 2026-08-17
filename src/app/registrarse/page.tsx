import type { Metadata } from "next"
import { RegistrarseClient } from "./registrarse-client"

export const metadata: Metadata = {
  title: "Crear cuenta — Convites",
  description:
    "Regístrate para aportar a los convites de tu comunidad. Cuéntanos cómo puedes ayudar.",
}

export default function RegistrarsePage() {
  return <RegistrarseClient />
}
