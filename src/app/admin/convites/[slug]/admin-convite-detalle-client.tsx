"use client"

import { IniciativaEditarClient } from "@/components/iniciativa/iniciativa-editar-client"

/** Edición admin: mismas pestañas que el creador (sobre, ubicación, ítems, multimedia, verificación, aportantes). */
export function AdminConviteDetalleClient() {
  return (
    <IniciativaEditarClient
      allowedRoles={["admin"]}
      backHref="/admin/convites"
      pathPrefix="/admin/convites"
      useEditarSuffix={false}
    />
  )
}
