import type { AuthUser } from "@/lib/types"
import {
  canAccessProfesionalPanel,
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
    return [
      { href: "/admin/usuarios", label: "Usuarios" },
      { href: "/admin/moderadores", label: "Moderadores" },
      { href: "/admin/voluntarios", label: "Voluntarios" },
      { href: "/admin/solicitudes-rol", label: "Solicitudes de rol" },
      { href: "/admin/convites", label: "Auditoría convites" },
      { href: "/admin/moderacion", label: "Moderación" },
      { href: "/perfil", label: "Mi perfil" },
    ]
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
