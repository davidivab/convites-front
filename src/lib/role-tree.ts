import type { AuthUser } from "@/lib/types"

/**
 * Árboles de rutas por rol.
 * Producto (P46/F29): solo admin vs ciudadano. Moderador/voluntario/profesional
 * son roles aditivos del ciudadano (solicitud → aprobación admin).
 * `resolvePrimaryRole` sigue sirviendo para home/redirects; la nav del ciudadano
 * siempre incluye las pestañas de solicitud.
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

export function hasModeratorRole(user: AuthUser | null | undefined): boolean {
  return Boolean(
    user?.roles?.includes("moderator") ||
      user?.permissions?.includes("iniciativas.moderate"),
  )
}

export function hasVoluntarioRole(user: AuthUser | null | undefined): boolean {
  return Boolean(user?.roles?.includes("voluntario"))
}

export type DashboardNavItem = { href: string; label: string }

/** Nav de ciudadano: aportante/organizador + solicitudes de rol (+ paneles operativos si aplica). */
function ciudadanoNavItems(user: AuthUser): DashboardNavItem[] {
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
    { href: "/panel/roles/voluntario", label: "Voluntario" },
  ]
  return items
}

/**
 * Ítems del menú de cuenta / dashboard según rol.
 * Admin: admin + moderación. Ciudadano (incl. mod/vol/prof aditivos): paneles + solicitudes.
 */
export function dashboardItemsForRole(
  user: AuthUser | null | undefined,
): DashboardNavItem[] {
  const primary = resolvePrimaryRole(user)
  if (!primary || !user) return []

  if (primary === "admin") {
    return [
      { href: "/admin/ciudadanos", label: "Ciudadanos" },
      { href: "/admin/usuarios", label: "Usuarios" },
      { href: "/admin/moderadores", label: "Moderadores" },
      { href: "/admin/voluntarios", label: "Voluntarios" },
      { href: "/admin/solicitudes-rol", label: "Solicitudes de rol" },
      { href: "/admin/convites", label: "Auditoría convites" },
      { href: "/admin/moderacion", label: "Moderación" },
      { href: "/admin/estadisticas", label: "Estadísticas" },
      { href: "/perfil", label: "Mi perfil" },
    ]
  }

  // Moderador / profesional / aportante: todos son ciudadanos con nav completa.
  const items = ciudadanoNavItems(user)
  if (primary === "moderador" && !items.some((i) => i.href === "/moderacion")) {
    items.splice(2, 0, { href: "/moderacion", label: "Moderación" })
  }
  items.push({ href: "/perfil", label: "Mi perfil" })
  return items
}

/** Tabs de página de perfil / paneles (mismas secciones que el dropdown). */
export function perfilTabsForRole(
  user: AuthUser | null | undefined,
  activeHref = "/perfil",
): Array<DashboardNavItem & { active?: boolean }> {
  const primary = resolvePrimaryRole(user)

  const items: DashboardNavItem[] =
    primary === "admin"
      ? [
          { href: "/admin/ciudadanos", label: "Ciudadanos" },
          { href: "/admin/usuarios", label: "Usuarios" },
          { href: "/admin/moderadores", label: "Moderadores" },
          { href: "/admin/voluntarios", label: "Voluntarios" },
          { href: "/admin/solicitudes-rol", label: "Solicitudes" },
          { href: "/admin/convites", label: "Convites" },
          { href: "/admin/moderacion", label: "Moderación" },
          { href: "/admin/estadisticas", label: "Estadísticas" },
          { href: "/perfil", label: "Perfil" },
        ]
      : !user
        ? []
        : [
            ...ciudadanoNavItems(user),
            { href: "/perfil", label: "Perfil" },
          ]

  // Prefijo más largo gana: evita que /admin quede activo en /admin/convites.
  const activeMatch = items
    .filter(
      (i) => activeHref === i.href || activeHref.startsWith(`${i.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0]

  return items.map((i) => ({
    ...i,
    active: activeMatch?.href === i.href,
  }))
}

/** Rutas del panel aportante/creador/roles — no para admin. */
export function isPanelTreePath(pathname: string): boolean {
  return pathname === "/panel" || pathname.startsWith("/panel/")
}
