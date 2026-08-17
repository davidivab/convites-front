export type EstadoIniciativa =
  | "borrador"
  | "en-revision"
  | "publicada"
  | "en-curso"
  | "cerrada"
  | "rechazada";
export type Urgencia = "alta" | "media" | "baja";
export type Categoria =
  | "vivienda"
  | "comunitario"
  | "educacion"
  | "alimentacion"
  | "herramientas";

export type ItemNecesario = {
  id: string;
  nombre: string;
  unidad: string;
  meta: number;
  aportado: number;
};

export type Ayudante = {
  nombre: string;
  aporte: string;
  inicial: string;
};

export type Iniciativa = {
  id: string;
  slug: string;
  titulo: string;
  resumen: string;
  historia: string[];
  zona: string;
  categoria: Categoria;
  urgencia: Urgencia;
  estado: EstadoIniciativa;
  imagen: string;
  creador: string;
  creadorInicial: string;
  fechaConvite: string;
  fechaISO?: string;
  lugarConvite: string;
  lugarPublico?: string;
  lugarExacto?: string | null;
  lat?: number | null;
  lng?: number | null;
  items: ItemNecesario[];
  puntosAcopio?: Array<{
    id: string;
    nombre: string;
    direccion: string;
    horario: string | null;
    contacto: string | null;
    ciudad: string;
  }>;
  ayudantes: Ayudante[];
  asistentes: number;
  progreso?: number;
  /** Optimistic lock del API — enviar en PUT */
  version?: number;
  enlaceExterno?: { plataforma: string; url: string };
  notaModeracion?: string | null;
};

export const CATEGORIAS: Record<Categoria, string> = {
  vivienda: "Vivienda",
  comunitario: "Espacio comunitario",
  educacion: "Educación",
  alimentacion: "Alimentación",
  herramientas: "Herramientas",
};

export const ESTADO_LABEL: Record<EstadoIniciativa, string> = {
  borrador: "Borrador",
  "en-revision": "En revisión",
  publicada: "Publicada",
  "en-curso": "En curso",
  cerrada: "Cerrada",
  rechazada: "Rechazada",
};

export const URGENCIA_LABEL: Record<Urgencia, string> = {
  alta: "Urgencia alta",
  media: "Urgencia media",
  baja: "Sin prisa",
};

export function progresoItem(item: ItemNecesario) {
  if (item.meta <= 0) return 0;
  return Math.min(100, Math.round((item.aportado / item.meta) * 100));
}

export function progresoTotal(items: ItemNecesario[]) {
  if (items.length === 0) return 0;
  const suma = items.reduce((acc, i) => acc + progresoItem(i), 0);
  return Math.round(suma / items.length);
}

export const HABILIDADES_MANUALES = [
  "Albañilería y construcción",
  "Carpintería",
  "Plomería",
  "Electricidad",
  "Pintura",
  "Techado y tejas",
  "Soldadura",
  "Cocina para grupos",
  "Manejo de herramientas",
  "Cargue y trabajo de fuerza",
  "Jardinería y limpieza",
  "Conducción / transporte",
];

export const HABILIDADES_CONOCIMIENTO = [
  "Primeros auxilios / salud",
  "Enseñanza y refuerzo escolar",
  "Trámites y papeleo",
  "Diseño y comunicación",
  "Contabilidad / manejo de recursos",
  "Coordinación y logística",
  "Traducción / lenguas indígenas",
  "Acompañamiento psicosocial",
];

export const DISPONIBILIDAD = [
  "Entre semana en la mañana",
  "Entre semana en la tarde",
  "Fines de semana",
  "Solo en emergencias",
  "Disponible para viajar a otras veredas",
];

export const APTITUD_FISICA = [
  {
    value: "alta",
    label: "Puedo hacer trabajo físico pesado",
    hint: "Cargar, subir a techos, jornadas largas.",
  },
  {
    value: "media",
    label: "Trabajo físico moderado",
    hint: "Tareas livianas, sin grandes esfuerzos.",
  },
  {
    value: "baja",
    label: "Mejor apoyo no físico",
    hint: "Prefiero ayudar con logística, cocina o conocimientos.",
  },
];

export const GENEROS = [
  { value: "mujer", label: "Mujer" },
  { value: "hombre", label: "Hombre" },
  { value: "no-binario", label: "No binario" },
  { value: "prefiero-no-decir", label: "Prefiero no decir" },
];

export type TipoCentro =
  | "acopio"
  | "albergue"
  | "bomberos"
  | "hospital"
  | "policia"
  | "defensa-civil";

export type EstadoCentro = "abierto" | "cerrado" | "lleno" | "24h";

export type Centro = {
  id: string;
  tipo: TipoCentro;
  nombre: string;
  zona: string;
  direccion: string;
  telefono: string;
  horario: string;
  estado: EstadoCentro;
  descripcion: string;
  necesita?: string[];
  noRecibe?: string[];
  capacidad?: { total: number; ocupado: number };
  emergencia?: boolean;
};

export const TIPO_CENTRO: Record<TipoCentro, { label: string; plural: string }> = {
  acopio: { label: "Centro de acopio", plural: "Centros de acopio" },
  albergue: { label: "Albergue", plural: "Albergues" },
  bomberos: { label: "Bomberos", plural: "Bomberos" },
  hospital: { label: "Hospital / centro de salud", plural: "Hospitales" },
  policia: { label: "Policía", plural: "Policía" },
  "defensa-civil": { label: "Defensa Civil", plural: "Defensa Civil" },
};

export const ESTADO_CENTRO_LABEL: Record<EstadoCentro, string> = {
  abierto: "Abierto ahora",
  cerrado: "Cerrado",
  lleno: "Sin cupo",
  "24h": "Atiende 24 horas",
};

export type AreaProfesional =
  | "psicologia"
  | "legal"
  | "arquitectura"
  | "nutricion"
  | "salud";

export type Profesional = {
  id: string;
  area: AreaProfesional;
  nombre: string;
  titulo: string;
  zona: string;
  modalidad: "Presencial" | "Virtual" | "Presencial y virtual";
  disponibilidad: string;
  descripcion: string;
  inicial: string;
};

export const AREA_PROFESIONAL: Record<
  AreaProfesional,
  { label: string; descripcion: string }
> = {
  psicologia: {
    label: "Apoyo psicológico",
    descripcion: "Acompañamiento emocional y manejo del duelo tras la emergencia.",
  },
  legal: {
    label: "Asesoría legal",
    descripcion: "Orientación en trámites, predios, seguros y derechos.",
  },
  arquitectura: {
    label: "Arquitectura e ingeniería civil",
    descripcion: "Evaluación de estructuras y guía para reconstruir con seguridad.",
  },
  nutricion: {
    label: "Nutrición",
    descripcion: "Planes de alimentación para albergues, niños y adultos mayores.",
  },
  salud: {
    label: "Salud y primeros auxilios",
    descripcion: "Atención básica, curaciones y control de enfermedades comunes.",
  },
};
