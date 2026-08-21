import type { AuthUser } from "@/lib/types"
import {
  canAccessProfesionalPanel,
  dashboardItemsForRole,
  hasModeratorRole,
  hasVoluntarioRole,
  resolvePrimaryRole,
  type DashboardNavItem,
} from "@/lib/role-tree"

/**
 * Secciones del dropdown de cuenta (header). Misma fuente que dashboardItemsForRole.
 */
export function accountMenuItems(user: AuthUser | null | undefined): DashboardNavItem[] {
  if (!user) return []
  const primary = resolvePrimaryRole(user)
  if (primary === "admin") {
    return dashboardItemsForRole(user)
  }

  const items: DashboardNavItem[] = [
    { href: "/panel/aportante", label: "Ayudas" },
    { href: "/panel/creador", label: "Convites" },
    {
      href: hasModeratorRole(user) ? "/moderacion" : "/panel/roles/moderador",
      label: "Moderador",
    },
    {
      href: canAccessProfesionalPanel(user)
        ? "/panel/profesional"
        : "/panel/roles/profesional",
      label: "Profesional",
    },
    {
      href: "/panel/roles/voluntario",
      label: hasVoluntarioRole(user) ? "Voluntario (activo)" : "Voluntario",
    },
    { href: "/perfil", label: "Mi perfil" },
  ]
  return items
}
