import { describe, expect, it } from "vitest"
import {
  homeForRole,
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
