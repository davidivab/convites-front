import type { Metadata } from "next"
import { PanelProfesionalClient } from "./profesional-client"

export const metadata: Metadata = {
  title: "Panel profesional | Convites",
}

export default function PanelProfesionalPage() {
  return <PanelProfesionalClient />
}
