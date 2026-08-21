import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Detalle convite | Admin",
}

/** Sin pestaña → /info (URL canónica por sección). */
export default async function AdminConviteDetalleIndexPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`/admin/convites/${slug}/info`)
}
