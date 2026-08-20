import { describe, expect, it } from "vitest"
import { resolveApiErrorStep } from "@/lib/crear-schema"

describe("resolveApiErrorStep", () => {
  it("maps a zona_id error to step 1 (Ubicación y fechas)", () => {
    expect(
      resolveApiErrorStep({
        zona_id: ["El campo zona es obligatorio cuando municipio no está presente."],
      }),
    ).toBe(1)
  })

  it("maps an indexed items.0.nombre error to step 2 (Qué se necesita)", () => {
    expect(
      resolveApiErrorStep({
        "items.0.nombre": ["El campo nombre es obligatorio."],
      }),
    ).toBe(2)
  })

  it("maps a persona_responsable error to step 4 (Verificación)", () => {
    expect(
      resolveApiErrorStep({
        persona_responsable: ["El campo persona responsable es obligatorio."],
      }),
    ).toBe(4)
  })

  it("returns null for an unknown field", () => {
    expect(
      resolveApiErrorStep({
        campo_desconocido: ["Algo salió mal."],
      }),
    ).toBeNull()
  })

  it("returns null when there are no errors", () => {
    expect(resolveApiErrorStep(undefined)).toBeNull()
    expect(resolveApiErrorStep(null)).toBeNull()
    expect(resolveApiErrorStep({})).toBeNull()
  })
})
