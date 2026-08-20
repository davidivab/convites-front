import { describe, expect, it } from "vitest"
import { sortGeoCatalog } from "@/lib/geo-sort"

describe("sortGeoCatalog", () => {
  it("pone emergencia primero y luego orden alfabético", () => {
    const sorted = sortGeoCatalog([
      { nombre: "Antioquia", emergencia: false },
      { nombre: "Valle del Cauca", emergencia: true },
      { nombre: "Amazonas", emergencia: false },
      { nombre: "Chocó", emergencia: true },
      { nombre: "Risaralda", emergencia: true },
    ])
    expect(sorted.map((x) => x.nombre)).toEqual([
      "Chocó",
      "Risaralda",
      "Valle del Cauca",
      "Amazonas",
      "Antioquia",
    ])
  })
})
