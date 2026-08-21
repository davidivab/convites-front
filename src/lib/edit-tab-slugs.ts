/**
 * Slugs de URL ↔ pestañas del editor de convite (admin y, opcional, creador).
 *
 * /admin/convites/{slug}/info
 * /admin/convites/{slug}/ubicacion
 * /admin/convites/{slug}/donde-comprar
 * …
 */

export const EDIT_TAB_SLUGS = [
  "info",
  "ubicacion",
  "donde-comprar",
  "que-se-necesita",
  "multimedia",
  "avances",
  "verificacion",
  "aportantes",
  "involucrados",
] as const

export type EditTabSlug = (typeof EDIT_TAB_SLUGS)[number]

export type EditTabId =
  | "sobre"
  | "ubicacion"
  | "proveedores"
  | "items"
  | "multimedia"
  | "avances"
  | "verificacion"
  | "aportantes"
  | "involucrados"

const SLUG_TO_TAB: Record<EditTabSlug, EditTabId> = {
  info: "sobre",
  ubicacion: "ubicacion",
  "donde-comprar": "proveedores",
  "que-se-necesita": "items",
  multimedia: "multimedia",
  avances: "avances",
  verificacion: "verificacion",
  aportantes: "aportantes",
  involucrados: "involucrados",
}

const TAB_TO_SLUG: Record<EditTabId, EditTabSlug> = {
  sobre: "info",
  ubicacion: "ubicacion",
  proveedores: "donde-comprar",
  items: "que-se-necesita",
  multimedia: "multimedia",
  avances: "avances",
  verificacion: "verificacion",
  aportantes: "aportantes",
  involucrados: "involucrados",
}

export function isEditTabSlug(value: string): value is EditTabSlug {
  return (EDIT_TAB_SLUGS as readonly string[]).includes(value)
}

export function tabIdFromSlug(slug: string | null | undefined): EditTabId {
  if (slug && isEditTabSlug(slug)) return SLUG_TO_TAB[slug]
  return "sobre"
}

export function slugFromTabId(tab: EditTabId): EditTabSlug {
  return TAB_TO_SLUG[tab]
}

/** Pestañas solo visibles en rutas admin. */
export function isAdminOnlyTab(tab: EditTabId): boolean {
  return tab === "involucrados"
}
