"use client"

import { IniciativaEditarClient } from "@/components/iniciativa/iniciativa-editar-client"
import type { EditTabSlug } from "@/lib/edit-tab-slugs"

/** Edición admin: pestañas en URL `/admin/convites/[slug]/[tab]`. */
export function AdminConviteDetalleClient({
  tabSlug = "info",
}: {
  tabSlug?: EditTabSlug
}) {
  return (
    <IniciativaEditarClient
      allowedRoles={["admin"]}
      backHref="/admin/convites"
      pathPrefix="/admin/convites"
      useEditarSuffix={false}
      urlTabSlug={tabSlug}
    />
  )
}
