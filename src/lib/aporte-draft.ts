const draftKey = (slug: string) => `convites_aporte_draft_${slug}`

export type AporteDraft = {
  cantidades: Record<string, number>
  asisto: boolean
  anonimo: boolean
  puntoAcopioId: string
  comproDeProveedor: boolean
  proveedorId: string
  fechaEntrega: string
  /** Paso del wizard (1–4) al ir a auth. */
  paso?: number
  /** Abrir modal de compromiso al volver (p. ej. solo tiempo). */
  openCompromiso?: boolean
  modoTiempo?: boolean
}

export function saveAporteDraft(slug: string, draft: AporteDraft): void {
  try {
    sessionStorage.setItem(draftKey(slug), JSON.stringify(draft))
  } catch {
    // ignore
  }
}

export function loadAporteDraft(slug: string): AporteDraft | null {
  try {
    const raw = sessionStorage.getItem(draftKey(slug))
    if (!raw) return null
    return JSON.parse(raw) as AporteDraft
  } catch {
    return null
  }
}

export function clearAporteDraft(slug: string): void {
  try {
    sessionStorage.removeItem(draftKey(slug))
  } catch {
    // ignore
  }
}
