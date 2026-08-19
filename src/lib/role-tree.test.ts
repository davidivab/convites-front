import { describe, expect, it } from "vitest"
import {
  dashboardItemsForRole,
  homeForRole,
  perfilTabsForRole,
  resolvePrimaryRole,
  type RoleTree,
} from "./role-tree"
import type { AuthUser } from "./types"

function user(partial: Partial<AuthUser>): AuthUser {
  return {
    id: 1,
    name: "Test",
    email: "t@test.com",
    roles: [],
    permissions: [],
    ...partial,
  }
}

describe("resolvePrimaryRole", () => {
  it("prioriza admin sobre moderador", () => {
    expect(
      resolvePrimaryRole(
        user({
          roles: ["admin", "moderator"],
          permissions: ["users.manage", "iniciativas.moderate"],
        }),
      ),
    ).toBe("admin")
  })

  it("detecta moderador por permiso", () => {
    expect(
      resolvePrimaryRole(
        user({ roles: ["moderator"], permissions: ["iniciativas.moderate"] }),
      ),
    ).toBe("moderador")
  })

  it("cae en aportante", () => {
    expect(
      resolvePrimaryRole(user({ roles: ["member"], permissions: ["aportes.create"] })),
    ).toBe("aportante")
  })

  it("member+profesional sigue en árbol aportante (aditivo)", () => {
    expect(
      resolvePrimaryRole(
        user({
          roles: ["member", "profesional"],
          permissions: ["aportes.create", "profesional_perfil.view_own"],
        }),
      ),
    ).toBe("aportante")
  })

  it("profesional puro va a su panel", () => {
    expect(
      resolvePrimaryRole(
        user({
          roles: ["profesional"],
          permissions: ["profesional_perfil.view_own"],
        }),
      ),
    ).toBe("profesional")
  })
})

describe("homeForRole", () => {
  const cases: [RoleTree, string][] = [
    ["admin", "/admin"],
    ["moderador", "/moderacion"],
    ["profesional", "/panel/profesional"],
    ["aportante", "/panel/aportante"],
  ]
  it.each(cases)("%s → %s", (role, home) => {
    expect(homeForRole(role)).toBe(home)
  })
})

describe("dashboardItemsForRole", () => {
  it("admin ve usuarios/moderadores/voluntarios + solicitudes + moderación + perfil", () => {
    const items = dashboardItemsForRole(
      user({
        roles: ["admin"],
        permissions: ["users.manage", "iniciativas.moderate"],
      }),
    )
    expect(items.map((i) => i.href)).toEqual([
      "/admin/ciudadanos",
      "/admin/usuarios",
      "/admin/moderadores",
      "/admin/voluntarios",
      "/admin/solicitudes-rol",
      "/admin/convites",
      "/admin/moderacion",
      "/admin/estadisticas",
      "/perfil",
    ])
  })

  it("moderador ciudadano ve paneles + moderación operativa", () => {
    const items = dashboardItemsForRole(
      user({
        roles: ["member", "moderator"],
        permissions: ["aportes.create", "iniciativas.moderate"],
      }),
    )
    expect(items.map((i) => i.href)).toContain("/moderacion")
    expect(items.map((i) => i.href)).toContain("/panel/aportante")
    expect(items.map((i) => i.href)).toContain("/panel/roles/voluntario")
  })

  it("aportante ve aportante + organizador + 3 roles + perfil", () => {
    const items = dashboardItemsForRole(
      user({ roles: ["member"], permissions: ["aportes.create"] }),
    )
    expect(items.map((i) => i.href)).toEqual([
      "/panel/aportante",
      "/panel/creador",
      "/panel/roles/moderador",
      "/panel/roles/profesional",
      "/panel/roles/voluntario",
      "/perfil",
    ])
  })
})

describe("perfilTabsForRole", () => {
  const admin = user({
    roles: ["admin"],
    permissions: ["users.manage", "iniciativas.moderate"],
  })

  it("admin siempre ve las pestañas de listas + operación", () => {
    const tabs = perfilTabsForRole(admin, "/admin/usuarios")
    expect(tabs.map((t) => t.label)).toEqual([
      "Ciudadanos",
      "Usuarios",
      "Moderadores",
      "Voluntarios",
      "Solicitudes",
      "Convites",
      "Moderación",
      "Estadísticas",
      "Perfil",
    ])
    expect(tabs.map((t) => t.href)).toEqual([
      "/admin/ciudadanos",
      "/admin/usuarios",
      "/admin/moderadores",
      "/admin/voluntarios",
      "/admin/solicitudes-rol",
      "/admin/convites",
      "/admin/moderacion",
      "/admin/estadisticas",
      "/perfil",
    ])
  })

  it("en /admin/convites solo Convites queda activo (no Usuarios)", () => {
    const tabs = perfilTabsForRole(admin, "/admin/convites")
    expect(tabs.find((t) => t.href === "/admin/usuarios")?.active).toBe(false)
    expect(tabs.find((t) => t.href === "/admin/convites")?.active).toBe(true)
    expect(tabs.find((t) => t.href === "/admin/solicitudes-rol")?.active).toBe(
      false,
    )
  })

  it("en /admin/solicitudes-rol solo Solicitudes queda activo", () => {
    const tabs = perfilTabsForRole(admin, "/admin/solicitudes-rol")
    expect(tabs.find((t) => t.href === "/admin/solicitudes-rol")?.active).toBe(
      true,
    )
    expect(tabs.find((t) => t.href === "/admin/usuarios")?.active).toBe(false)
  })

  it("en /admin/moderacion solo Moderación queda activo", () => {
    const tabs = perfilTabsForRole(admin, "/admin/moderacion")
    expect(tabs.find((t) => t.href === "/admin/moderacion")?.active).toBe(true)
    expect(tabs.find((t) => t.href === "/admin/usuarios")?.active).toBe(false)
  })

  it("en /admin/moderadores solo Moderadores queda activo", () => {
    const tabs = perfilTabsForRole(admin, "/admin/moderadores")
    expect(tabs.find((t) => t.href === "/admin/moderadores")?.active).toBe(true)
    expect(tabs.find((t) => t.href === "/admin/usuarios")?.active).toBe(false)
  })
})
