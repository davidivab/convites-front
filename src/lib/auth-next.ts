/**
 * Destino post-login/registro. Solo rutas relativas internas.
 */
const NEXT_KEY = "convites_auth_next"

export function safeNextPath(
  raw: string | null | undefined,
  fallback = "/panel/aportante",
): string {
  if (!raw) return fallback
  let value = raw.trim()
  try {
    value = decodeURIComponent(value)
  } catch {
    // keep raw
  }
  if (!value.startsWith("/") || value.startsWith("//")) return fallback
  return value
}

/** Guarda next para OAuth (Google) u otros saltos sin query. */
export function rememberAuthNext(path: string | null | undefined): void {
  const safe = path ? safeNextPath(path, "") : ""
  try {
    if (!safe || safe === "/panel/aportante") {
      sessionStorage.removeItem(NEXT_KEY)
      return
    }
    sessionStorage.setItem(NEXT_KEY, safe)
  } catch {
    // ignore
  }
}

/** Lee y limpia el next guardado (p. ej. tras Google). */
export function consumeAuthNext(fallback = "/panel/aportante"): string {
  let stored: string | null = null
  try {
    stored = sessionStorage.getItem(NEXT_KEY)
    sessionStorage.removeItem(NEXT_KEY)
  } catch {
    // ignore
  }
  return safeNextPath(stored, fallback)
}

export function peekAuthNext(): string | null {
  try {
    return sessionStorage.getItem(NEXT_KEY)
  } catch {
    return null
  }
}

export function authNextQuery(path: string | null | undefined): string {
  const safe = path ? safeNextPath(path, "") : ""
  if (!safe || safe === "/panel/aportante") return ""
  return `?next=${encodeURIComponent(safe)}`
}
