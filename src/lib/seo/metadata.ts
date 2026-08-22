import type { Metadata } from "next"
import { absoluteUrl, getSiteUrl } from "@/lib/site-url"
import { designTokenHex } from "@/lib/design-tokens"

const SITE = "Convites"
const DEFAULT_TITLE =
  "Convites — convites comunitarios en Colombia: materiales, tiempo y manos"
const DEFAULT_DESCRIPTION =
  "Plataforma ciudadana para organizar convites en Colombia tras emergencias: aporta tejas, cemento, comida o tu tiempo. No somos fundación ni empresa; no recibimos ni administramos dinero. Vecinos ayudando vecinos."

/**
 * Metadata raíz: title template + defaults potentes para social / SEO.
 * Las páginas públicas sobreescriben title/description; el template mantiene la marca.
 */
export function rootMetadata(): Metadata {
  const url = getSiteUrl()
  const ogImage = absoluteUrl("/images/hero-convite.png")

  return {
    metadataBase: new URL(url),
    title: {
      default: DEFAULT_TITLE,
      template: `%s · ${SITE}`,
    },
    description: DEFAULT_DESCRIPTION,
    applicationName: SITE,
    authors: [{ name: "Convites", url }],
    creator: SITE,
    publisher: SITE,
    category: "community",
    classification: "Civic mutual aid / community reconstruction",
    keywords: [
      "convites",
      "Colombia",
      "convite comunitario",
      "reconstrucción",
      "terremoto",
      "ayuda en especie",
      "voluntariado",
      "minga",
      "vecinos",
      "materiales de construcción",
      "albergues",
      "centros de acopio",
      "manos profesionales",
      "Risaralda",
      "Chocó",
      "Valle del Cauca",
    ],
    referrer: "origin-when-cross-origin",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    alternates: {
      canonical: "/",
      languages: {
        "es-CO": "/",
        es: "/",
      },
    },
    openGraph: {
      type: "website",
      locale: "es_CO",
      url,
      siteName: SITE,
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "Vecinos de Colombia reunidos en un convite comunitario reconstruyendo juntos",
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    other: {
      "theme-color": designTokenHex.background,
    },
  }
}

/** Metadata específica de la home (máximo refuerzo sobre la raíz). */
export function homeMetadata(): Metadata {
  const url = getSiteUrl()
  const title =
    "Convites | Colombia se levanta en convite: aporta materiales o tiempo"
  const description =
    "Después del terremoto y otras emergencias, los barrios de Colombia se organizan en convites: cada quien lleva lo que puede —tejas, cemento, comida o un día de trabajo—. Encuentra un convite cerca, crea el tuyo o consulta lugares de ayuda y manos profesionales. Sin donaciones en efectivo en la plataforma."

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "es_CO",
      url,
      siteName: "Convites",
      title,
      description,
      images: [
        {
          url: absoluteUrl("/images/hero-convite.png"),
          width: 1200,
          height: 630,
          alt: "Colombia se levanta cuando nos juntamos — convite comunitario",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/images/hero-convite.png")],
    },
  }
}
