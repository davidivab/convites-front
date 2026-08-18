"use client"

import { IniciativaEditarClient } from "@/components/iniciativa/iniciativa-editar-client"

export function CreadorEditarClient() {
  return (
    <IniciativaEditarClient
      allowedRoles={["aportante"]}
      backHref="/panel/creador"
      pathPrefix="/panel/creador"
    />
  )
}
