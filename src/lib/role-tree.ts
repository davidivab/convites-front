import type { AuthUser } from "@/lib/types"

/**
 * Árboles de rutas por rol.
 * Jerarquía: admin > moderador > aportante.
 * `profesional` es aditivo (member+profesional): puede usar /panel/profesional
 * sin perder el árbol aportante.
 */
export type RoleTree = "admin" | "moderador" | "aportante" | "profesional"

export function resolvePrimaryRole(user: AuthUser | null | undefined): RoleTree | null {
  if (!user) return null
  if (user.roles.includes("admin") || user.permissions.includes("users.manage")) {
    return "admin"
  }
  if (
    user.roles.includes("moderator") ||
    user.permissions.includes("iniciativas.moderate")
  ) {
    return "moderador"
  }
  // Solo profesional puro (sin member/voluntario) → home en su panel.
  if (
    user.roles.includes("profesional") &&
    !user.roles.includes("member") &&
    !user.roles.includes("voluntario")
  ) {
    return "profesional"
  }
  return "aportante"
}

export function homeForRole(role: RoleTree): string {
  switch (role) {
    case "admin":
      return "/admin"
    case "moderador":
      return "/moderacion"
    case "profesional":
      return "/panel/profesional"
    default:
      return "/panel/aportante"
  }
}

export function canAccessProfesionalPanel(user: AuthUser | null | undefined): boolean {
  return Boolean(
    user?.permissions?.includes("profesional_perfil.view_own") ||
      user?.roles?.includes("profesional"),
  )
}

/** Rutas del panel de aportante/creador — no para admin ni moderador. */
export function isPanelTreePath(pathname: string): boolean {
  return (
    pathname === "/panel" ||
    pathname.startsWith("/panel/") ||
    pathname === "/perfil" ||
    pathname.startsWith("/perfil/")
  )
}
