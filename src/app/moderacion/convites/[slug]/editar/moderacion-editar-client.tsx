"use client"

import { IniciativaEditarClient } from "@/components/iniciativa/iniciativa-editar-client"

export function ModeracionEditarClient() {
  return (
    <IniciativaEditarClient
      allowedRoles={["admin", "moderador"]}
      backHref="/moderacion"
      pathPrefix="/moderacion/convites"
    />
  )
}
