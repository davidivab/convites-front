import type { Metadata } from "next"
import { CreadorEditarClient } from "./creador-editar-client"

export const metadata: Metadata = {
  title: "Editar convite | Convites",
}

export default function CreadorEditarPage() {
  return <CreadorEditarClient />
}
