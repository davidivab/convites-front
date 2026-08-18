import type { Metadata } from "next"
import { ModeracionPageClient } from "./moderacion-page-client"

export const metadata: Metadata = {
  title: "Moderación — Convites",
}

export default function ModeracionPage() {
  return <ModeracionPageClient />
}
