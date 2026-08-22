/** Emite JSON-LD para crawlers (Google, Bing, AI search). */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Contenido generado por nosotros (no input de usuario crudo).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
