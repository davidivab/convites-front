import type { AuthUser } from "@/lib/types"

/** Árboles de rutas por rol (admin > moderador > aportante). */
export type RoleTree = "admin" | "moderador" | "aportante"

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
  return "aportante"
}

export function homeForRole(role: RoleTree): string {
  switch (role) {
    case "admin":
      return "/admin"
    case "moderador":
      return "/moderacion"
    default:
      return "/panel/aportante"
  }
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
