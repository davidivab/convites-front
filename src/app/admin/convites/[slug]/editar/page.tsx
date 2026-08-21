import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Editar convite | Admin",
}

/** Legacy /editar → pestaña info. */
export default async function AdminConviteEditarPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`/admin/convites/${slug}/info`)
}
