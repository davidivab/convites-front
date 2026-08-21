import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { AdminConviteDetalleClient } from "../admin-convite-detalle-client"
import { isEditTabSlug } from "@/lib/edit-tab-slugs"

export const metadata: Metadata = {
  title: "Detalle convite | Admin",
}

export default async function AdminConviteDetalleTabPage({
  params,
}: {
  params: Promise<{ slug: string; tab: string }>
}) {
  const { tab } = await params
  if (!isEditTabSlug(tab)) {
    notFound()
  }
  return <AdminConviteDetalleClient tabSlug={tab} />
}
