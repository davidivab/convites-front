/**
 * Orden de catálogo geo en selects: primero emergencia, luego A–Z (es).
 */
export function sortGeoCatalog<T extends { nombre: string; emergencia?: boolean }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const ae = a.emergencia ? 1 : 0
    const be = b.emergencia ? 1 : 0
    if (ae !== be) return be - ae
    return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
  })
}
