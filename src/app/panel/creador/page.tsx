import type { Metadata } from "next"
import { PanelCreadorClient } from "./creador-client"

export const metadata: Metadata = {
  title: "Mis convites — Convites",
}

export default function PanelCreadorPage() {
  return <PanelCreadorClient />
}
