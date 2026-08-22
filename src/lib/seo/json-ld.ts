/**
 * Constructores JSON-LD (schema.org) para Convites.
 *
 * Decisiones de tipo (investigación 2024–2026 SEO nonprofit / mutual aid):
 * - Plataforma → Organization (+ WebSite), NO NGO/NonprofitOrganization:
 *   Convites declara explícitamente que no es fundación ni empresa.
 * - Cada convite → Event (día del convite) + VolunteerAction (aportantes).
 * - Manos profesionales → ItemList de Person / ProfessionalService.
 * - Centros (info de interés) → EmergencyService / Hospital / FireStation /
 *   PoliceStation / CivicStructure según el tipo de lugar.
 */

import type { Centro, Iniciativa, Profesional } from "@/lib/data"
import { AREA_PROFESIONAL, TIPO_CENTRO } from "@/lib/data"
import { absoluteUrl, getSiteUrl } from "@/lib/site-url"

export type JsonLd = Record<string, unknown>

export function organizationId(): string {
  return `${getSiteUrl()}/#organization`
}

export function websiteId(): string {
  return `${getSiteUrl()}/#website`
}

export function buildOrganizationJsonLd(): JsonLd {
  const url = getSiteUrl()
  return {
    "@type": "Organization",
    "@id": organizationId(),
    name: "Convites",
    alternateName: "Convites Colombia",
    url,
    logo: absoluteUrl("/images/hero-convite.png"),
    description:
      "Plataforma ciudadana de convites comunitarios en Colombia: vecinos se organizan para aportar materiales, tiempo y manos profesionales tras emergencias. No somos fundación ni empresa; no recibimos ni administramos dinero.",
    foundingLocation: {
      "@type": "Country",
      name: "Colombia",
    },
    areaServed: {
      "@type": "Country",
      name: "Colombia",
    },
    knowsAbout: [
      "convites comunitarios",
      "reconstrucción tras desastres",
      "ayuda en especie",
      "voluntariado vecinal",
      "terremoto Colombia",
      "minga",
    ],
    slogan: "Colombia se levanta cuando nos juntamos",
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "community support",
      availableLanguage: ["Spanish", "es"],
      url: absoluteUrl("/quienes-somos"),
    },
  }
}

export function buildWebSiteJsonLd(): JsonLd {
  const url = getSiteUrl()
  return {
    "@type": "WebSite",
    "@id": websiteId(),
    url,
    name: "Convites",
    description:
      "Encuentra o crea un convite comunitario: aporta materiales o tiempo para reconstruir lo que la emergencia se llevó.",
    inLanguage: "es-CO",
    publisher: { "@id": organizationId() },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/convites?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

export function buildHomeFaqJsonLd(): JsonLd {
  return {
    "@type": "FAQPage",
    "@id": `${getSiteUrl()}/#faq`,
    mainEntity: [
      {
        "@type": "Question",
        name: "¿Qué es un convite?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Un convite es cuando el barrio o la vereda se junta a trabajar por alguien: cada quien lleva materiales, comida o tiempo. En Convites llevamos esa costumbre a lo digital para organizarnos tras emergencias en Colombia.",
        },
      },
      {
        "@type": "Question",
        name: "¿Convites recibe o administra dinero?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Aquí se aportan materiales, tiempo y manos profesionales. Si hace falta dinero, se gestiona por fuera de la plataforma y con transparencia entre vecinos.",
        },
      },
      {
        "@type": "Question",
        name: "¿Cómo creo un convite?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Entra a Crear un convite, cuenta qué pasó, qué falta y dónde es el encuentro. El equipo lo revisa antes de publicarlo para que sea real y respaldado por la comunidad.",
        },
      },
      {
        "@type": "Question",
        name: "¿Cómo puedo ayudar?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Explora los convites abiertos y súmate llevando materiales o apoyando con tu tiempo el día del convite. También puedes contactar manos profesionales voluntarias o consultar lugares de ayuda.",
        },
      },
    ],
  }
}

export function buildHomeGraphJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationJsonLd(),
      buildWebSiteJsonLd(),
      {
        "@type": "WebPage",
        "@id": absoluteUrl("/#webpage"),
        url: absoluteUrl("/"),
        name: "Convites — plataforma ciudadana de convites comunitarios en Colombia",
        isPartOf: { "@id": websiteId() },
        about: { "@id": organizationId() },
        description:
          "Vecinos organizando convites en las zonas afectadas de Colombia. Crea o súmate a un convite con materiales o tiempo.",
        inLanguage: "es-CO",
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: absoluteUrl("/images/hero-convite.png"),
        },
      },
      buildHomeFaqJsonLd(),
    ],
  }
}

export function buildIniciativaJsonLd(ini: Iniciativa): JsonLd {
  const url = absoluteUrl(`/iniciativa/${ini.slug}`)
  const place: JsonLd = {
    "@type": "Place",
    name: ini.lugarConvite || ini.zona,
    address: {
      "@type": "PostalAddress",
      addressLocality: ini.zona,
      addressCountry: "CO",
    },
  }
  if (ini.lat != null && ini.lng != null) {
    place.geo = {
      "@type": "GeoCoordinates",
      latitude: ini.lat,
      longitude: ini.lng,
    }
  }

  const event: JsonLd = {
    "@type": "Event",
    "@id": `${url}#event`,
    name: ini.titulo,
    description: ini.resumen,
    url,
    image: absoluteUrl(ini.imagen),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    isAccessibleForFree: true,
    location: place,
    organizer: {
      "@type": "Person",
      name: ini.creador,
    },
    performer: {
      "@id": organizationId(),
    },
    about: {
      "@type": "Thing",
      name: "Convite comunitario / reconstrucción vecinal",
    },
    keywords: [
      "convite",
      "Colombia",
      ini.zona,
      ini.categoria,
      "voluntariado",
      "ayuda en especie",
    ].join(", "),
  }

  if (ini.fechaISO) {
    event.startDate = ini.fechaISO
    // Día completo: endDate = mismo día (VALUE DATE style)
    event.endDate = ini.fechaISO
  }

  const needs = ini.items.map((it) => ({
    "@type": "Offer",
    name: it.nombre,
    description: `${it.aportado} de ${it.meta} ${it.unidad}${
      it.descripcion ? ` — ${it.descripcion}` : ""
    }`,
    availability:
      it.aportado >= it.meta
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
    price: 0,
    priceCurrency: "COP",
    category: "In-kind donation / material",
  }))

  const volunteer: JsonLd = {
    "@type": "VolunteerAction",
    "@id": `${url}#volunteer`,
    name: `Apoyar el convite: ${ini.titulo}`,
    description:
      "Súmate llevando materiales o apoyando con tu tiempo el día del convite. Sin aportes en efectivo en la plataforma.",
    url: absoluteUrl(`/iniciativa/${ini.slug}/aportar`),
    agent: { "@id": organizationId() },
    location: place,
    object: { "@id": `${url}#event` },
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: ini.titulo,
        description: ini.resumen,
        isPartOf: { "@id": websiteId() },
        about: { "@id": `${url}#event` },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Inicio",
              item: absoluteUrl("/"),
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Convites",
              item: absoluteUrl("/convites"),
            },
            {
              "@type": "ListItem",
              position: 3,
              name: ini.titulo,
              item: url,
            },
          ],
        },
      },
      event,
      volunteer,
      {
        "@type": "ItemList",
        name: "Materiales que se necesitan",
        itemListElement: needs.map((offer, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: offer,
        })),
      },
    ],
  }
}

function centroSchemaType(tipo: Centro["tipo"]): string {
  switch (tipo) {
    case "hospital":
      return "Hospital"
    case "bomberos":
      return "FireStation"
    case "policia":
      return "PoliceStation"
    case "albergue":
      return "EmergencyService"
    case "acopio":
      return "CivicStructure"
    case "defensa-civil":
      return "GovernmentOffice"
    case "censo":
      return "GovernmentOffice"
    default:
      return "CivicStructure"
  }
}

export function buildCentrosJsonLd(centros: Centro[]): JsonLd {
  const url = absoluteUrl("/centros")
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#webpage`,
        url,
        name: "Lugares de ayuda en Colombia — Convites",
        description:
          "Directorio de centros de acopio, albergues, hospitales, bomberos y líneas de emergencia.",
        isPartOf: { "@id": websiteId() },
        about: { "@id": organizationId() },
      },
      {
        "@type": "ItemList",
        name: "Lugares de ayuda",
        numberOfItems: centros.length,
        itemListElement: centros.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": centroSchemaType(c.tipo),
            name: c.nombre,
            description: c.descripcion,
            telephone: c.telefono || undefined,
            address: {
              "@type": "PostalAddress",
              streetAddress: c.direccion,
              addressLocality: c.zona,
              addressCountry: "CO",
            },
            additionalType: "https://schema.org/EmergencyService",
            category: TIPO_CENTRO[c.tipo]?.label,
            url: c.urlExterna || url,
          },
        })),
      },
    ],
  }
}

export function buildProfesionalesJsonLd(profesionales: Profesional[]): JsonLd {
  const url = absoluteUrl("/manos-profesionales")
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#webpage`,
        url,
        name: "Manos profesionales voluntarias — Convites",
        description:
          "Profesionales que donan apoyo psicológico, legal, de arquitectura, nutrición y salud sin costo.",
        isPartOf: { "@id": websiteId() },
        about: { "@id": organizationId() },
      },
      {
        "@type": "ItemList",
        name: "Manos profesionales",
        numberOfItems: profesionales.length,
        itemListElement: profesionales.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Person",
            name: p.nombre,
            jobTitle: p.titulo,
            description: p.descripcion,
            knowsAbout: AREA_PROFESIONAL[p.area]?.label,
            homeLocation: {
              "@type": "Place",
              name: p.zona,
              address: {
                "@type": "PostalAddress",
                addressLocality: p.zona,
                addressCountry: "CO",
              },
            },
            makesOffer: {
              "@type": "Offer",
              name: AREA_PROFESIONAL[p.area]?.label ?? p.area,
              description: p.disponibilidad,
              price: 0,
              priceCurrency: "COP",
              availability: "https://schema.org/InStock",
              category: "Volunteer professional service",
            },
          },
        })),
      },
    ],
  }
}
