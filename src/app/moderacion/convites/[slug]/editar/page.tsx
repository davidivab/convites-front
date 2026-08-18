import type { Metadata } from "next"
import { ModeracionEditarClient } from "./moderacion-editar-client"

export const metadata: Metadata = {
  title: "Editar convite | Moderación",
}

export default function ModeracionEditarPage() {
  return <ModeracionEditarClient />
}
