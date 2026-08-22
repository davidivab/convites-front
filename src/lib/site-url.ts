/**
 * URL canónica del sitio (SEO, sitemap, Open Graph, JSON-LD).
 * Preferir NEXT_PUBLIC_SITE_URL en prod (ej. https://convites.co).
 */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    "https://convites.co"
  return raw.replace(/\/$/, "")
}

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path
  const base = getSiteUrl()
  if (!path || path === "/") return base
  return `${base}${path.startsWith("/") ? path : `/${path}`}`
}
