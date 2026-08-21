"use client"

import { useMemo } from "react"
import { useAdminNavBadges } from "@/components/admin/use-admin-nav-badges"
import {
  perfilTabsForRole,
  type DashboardNavItem,
} from "@/lib/role-tree"
import type { AuthUser } from "@/lib/types"

/**
 * Pestañas admin con badges de pendientes (en revisión).
 */
export function useAdminPerfilTabs(
  user: AuthUser | null | undefined,
  token: string | null | undefined,
  activeHref: string,
): Array<DashboardNavItem & { active?: boolean }> {
  const badges = useAdminNavBadges(token)
  const base = perfilTabsForRole(user, activeHref)

  return useMemo(
    () =>
      base.map((t) => {
        if (t.href === "/admin/moderacion" && badges.moderacionPendientes > 0) {
          return { ...t, badge: badges.moderacionPendientes }
        }
        if (t.href === "/admin/convites" && badges.convitesPendientes > 0) {
          return { ...t, badge: badges.convitesPendientes }
        }
        return t
      }),
    [base, badges.convitesPendientes, badges.moderacionPendientes],
  )
}
