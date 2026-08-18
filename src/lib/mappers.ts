import type {
  ApiCentro,
  ApiIniciativa,
  ApiProfesional,
} from "@/lib/types";
import type {
  Categoria,
  Centro,
  EstadoIniciativa,
  Iniciativa,
  ItemNecesario,
  Profesional,
  TipoCentro,
  Urgencia,
} from "@/lib/data";

const IMAGE_BY_SLUG: Record<string, string> = {
  "reconstruir-casa-familia-quintero": "/images/campaign-casa.png",
  "comedor-comunitario-villa-santana": "/images/campaign-comedor.png",
  "reparar-escuela-vereda-el-manzano": "/images/campaign-escuela.png",
  "herramientas-para-los-convites": "/images/campaign-casa.png",
};

const ESTADO_MAP: Record<string, EstadoIniciativa> = {
  borrador: "borrador",
  en_revision: "en-revision",
  "en-revision": "en-revision",
  publicada: "publicada",
  en_curso: "en-curso",
  "en-curso": "en-curso",
  cerrada: "cerrada",
  rechazada: "rechazada",
};

export function mapEstado(estado: string): EstadoIniciativa {
  return ESTADO_MAP[estado] ?? "publicada";
}

export function mapIniciativa(api: ApiIniciativa): Iniciativa {
  const items: ItemNecesario[] = (api.items ?? []).map((item) => ({
    id: String(item.id),
    nombre: item.nombre,
    unidad: item.unidad,
    meta: item.cantidad_meta,
    aportado: item.cantidad_aportada,
  }));

  const categoriaSlug = (api.categoria?.slug ?? "comunitario") as Categoria;

  return {
    id: String(api.id),
    slug: api.slug,
    titulo: api.titulo,
    resumen: api.resumen,
    historia: api.historia ?? [],
    zona: api.municipio?.nombre
      ? (api.municipio.departamento
          ? `${api.municipio.nombre}, ${api.municipio.departamento.nombre}`
          : api.municipio.nombre)
      : (api.zona?.nombre ?? "Sin zona"),
    categoria: categoriaSlug,
    urgencia: api.urgencia as Urgencia,
    estado: mapEstado(api.estado),
    imagen: api.imagen_path || IMAGE_BY_SLUG[api.slug] || "/images/campaign-casa.png",
    creador: api.creador?.name ?? "Vecino",
    creadorInicial: api.creador?.inicial || (api.creador?.name?.[0] ?? "V"),
    fechaConvite: api.fecha_convite_texto || api.fecha_convite || "Por definir",
    fechaISO: api.fecha_convite ?? undefined,
    lugarConvite: api.lugar_convite,
    lugarPublico: api.lugar_convite,
    lugarExacto: api.lugar_exacto,
    lat: api.ubicacion?.lat ?? null,
    lng: api.ubicacion?.lng ?? null,
    items,
    puntosAcopio: (api.puntos_acopio ?? []).map((p) => ({
      id: String(p.id),
      nombre: p.nombre,
      direccion: p.direccion,
      horario: p.horario,
      contacto: p.contacto,
      ciudad: p.municipio
        ? p.municipio.departamento
          ? `${p.municipio.nombre}, ${p.municipio.departamento.nombre}`
          : p.municipio.nombre
        : "Sin ciudad",
    })),
    galeria: (api.galeria ?? []).map((g) => ({
      id: String(g.id),
      url: g.url,
    })),
    enlaces: (api.enlaces ?? []).map((e) => ({
      id: String(e.id),
      titulo: e.titulo,
      url: e.url,
    })),
    ayudantes: [],
    asistentes: api.asistentes_count ?? 0,
    progreso: api.progreso ?? 0,
    version: api.version,
    wizardPaso: api.wizard_paso ?? null,
    enlaceExterno: api.enlace_externo
      ? {
          plataforma: api.enlace_externo.plataforma,
          url: api.enlace_externo.url,
        }
      : undefined,
    notaModeracion: api.nota_moderacion ?? null,
  };
}

export function mapCentro(api: ApiCentro): Centro {
  const tipoRaw = api.tipo === "defensa_civil" ? "defensa-civil" : api.tipo;

  return {
    id: String(api.id),
    tipo: tipoRaw as TipoCentro,
    nombre: api.nombre,
    zona: api.zona?.nombre ?? "",
    direccion: api.direccion,
    telefono: api.telefono ?? "",
    horario: api.horario ?? "",
    estado: (api.estado === "24h" ? "24h" : api.estado) as Centro["estado"],
    descripcion: api.descripcion,
    necesita: api.necesita ?? undefined,
    noRecibe: api.no_recibe ?? undefined,
    capacidad:
      api.capacidad_total != null
        ? {
            total: api.capacidad_total,
            ocupado: api.capacidad_ocupada ?? 0,
          }
        : undefined,
    emergencia: api.emergencia,
    urlExterna: api.url_externa ?? null,
  };
}

export function mapProfesional(api: ApiProfesional): Profesional {
  const modalidadMap: Record<string, Profesional["modalidad"]> = {
    presencial: "Presencial",
    virtual: "Virtual",
    presencial_y_virtual: "Presencial y virtual",
    ambas: "Presencial y virtual",
  };

  return {
    id: String(api.id),
    area: api.area as Profesional["area"],
    nombre: api.nombre,
    titulo: api.titulo,
    zona: api.zona?.nombre ?? "",
    modalidad: modalidadMap[api.modalidad] ?? "Presencial",
    disponibilidad: api.disponibilidad,
    descripcion: api.descripcion,
    inicial: api.inicial || api.nombre[0] || "P",
  };
}
