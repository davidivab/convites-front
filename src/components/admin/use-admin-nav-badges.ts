"use client"

import { useCallback, useEffect, useState } from "react"
import { fetchAdminIniciativas } from "@/lib/convites-api"

export type AdminNavBadges = {
  /** Convites en revisión (pendientes de aprobar/rechazar). */
  convitesPendientes: number
  /** Cola de moderación sin revisar. */
  moderacionPendientes: number
}

const EMPTY: AdminNavBadges = {
  convitesPendientes: 0,
  moderacionPendientes: 0,
}

/**
 * Contadores para badges de pestañas admin (Convites / Moderación).
 * Consulta `en_revision` con `per_page=1` y usa `meta.total`.
 */
export function useAdminNavBadges(token: string | null | undefined): AdminNavBadges {
  const [badges, setBadges] = useState<AdminNavBadges>(EMPTY)

  const load = useCallback(async () => {
    if (!token) {
      setBadges(EMPTY)
      return
    }
    try {
      const pendientes = await fetchAdminIniciativas(token, {
        estado: "en_revision",
        per_page: 1,
        page: 1,
      })
      const n = pendientes.meta?.total ?? pendientes.data.length
      setBadges({
        convitesPendientes: n,
        moderacionPendientes: n,
      })
    } catch {
      setBadges(EMPTY)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  return badges
}
