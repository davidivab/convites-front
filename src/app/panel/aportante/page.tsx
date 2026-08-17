import type { Metadata } from "next"
import { PanelAportanteClient } from "./aportante-client"

export const metadata: Metadata = {
  title: "Mi panel — Convites",
}

export default function PanelAportantePage() {
  return <PanelAportanteClient />
}
