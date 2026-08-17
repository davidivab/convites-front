/** Tipos alineados a las responses JSON del API Laravel. */

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
  /** Municipios asignados (moderador / voluntario) */
  municipio_ids?: number[];
};

export type ApiZona = {
  id: number;
  slug: string;
  nombre: string;
  municipio?: string;
};

export type ApiDepartamento = {
  id: number;
  slug: string;
  nombre: string;
  codigo?: string | null;
};

export type ApiMunicipio = {
  id: number;
  departamento_id: number;
  slug: string;
  nombre: string;
};

export type ApiCategoria = {
  id: number;
  slug: string;
  nombre: string;
  descripcion?: string | null;
};

export type ApiIniciativaItem = {
  id: number;
  nombre: string;
  unidad: string;
  cantidad_meta: number;
  cantidad_aportada: number;
  faltante: number;
  progreso: number;
  orden: number;
};

/** Punto de recolección (puede ser otra ciudad que el destino del convite) */
export type ApiPuntoAcopio = {
  id: number;
  nombre: string;
  direccion: string;
  horario: string | null;
  contacto: string | null;
  notas: string | null;
  orden: number;
  lat: number | null;
  lng: number | null;
  centro_id: number | null;
  municipio: {
    id: number;
    slug: string;
    nombre: string;
    departamento?: { id: number; slug: string; nombre: string } | null;
  } | null;
};

export type ApiIniciativa = {
  id: number;
  slug: string;
  titulo: string;
  resumen: string;
  historia: string[];
  urgencia: "alta" | "media" | "baja";
  urgencia_label?: string;
  estado: string;
  estado_label?: string;
  nota_moderacion?: string | null;
  imagen_path: string | null;
  fecha_convite: string | null;
  fecha_limite_aportes: string | null;
  fecha_convite_texto: string | null;
  lugar_convite: string;
  lugar_exacto: string | null;
  ubicacion: {
    lat: number;
    lng: number;
    precision: string;
    mapa_visible: boolean;
  } | null;
  zona: { id: number; slug: string; nombre: string } | null;
  municipio?: {
    id: number;
    slug: string;
    nombre: string;
    departamento?: { id: number; slug: string; nombre: string } | null;
  } | null;
  categoria: { id: number; slug: string; nombre: string } | null;
  creador: { id: number; name: string; inicial: string | null } | null;
  enlace_externo: { plataforma: string; url: string } | null;
  items: ApiIniciativaItem[];
  puntos_acopio?: ApiPuntoAcopio[];
  asistentes_count: number;
  progreso: number;
  /** Optimistic lock — reenviar en PUT /iniciativas/{id} */
  version: number;
  destacada: boolean;
  publicada_at: string | null;
  created_at: string | null;
};

export type ApiAporte = {
  id: number;
  estado: string;
  estado_label?: string;
  asiste_al_convite: boolean;
  nota: string | null;
  anonimo?: boolean;
  confirmado_at: string | null;
  cancelado_at: string | null;
  cumplido_at?: string | null;
  aportante?: {
    id: number | null;
    name: string;
    inicial: string | null;
  } | null;
  punto_acopio?: {
    id: number;
    nombre: string;
    direccion?: string | null;
    municipio?: { id: number; nombre: string; slug?: string } | null;
  } | null;
  evidencia?: {
    url: string;
    nombre: string | null;
    mime: string | null;
  } | null;
  iniciativa: {
    id: number;
    slug: string;
    titulo: string;
    fecha_convite: string | null;
    lugar_convite: string;
    lugar_exacto: string | null;
  } | null;
  items: Array<{
    id: number;
    iniciativa_item_id: number;
    nombre: string | null;
    unidad: string | null;
    cantidad: number;
  }>;
  created_at?: string | null;
};

export type ApiCentro = {
  id: number;
  tipo: string;
  tipo_label?: string;
  nombre: string;
  direccion: string;
  telefono: string | null;
  horario: string | null;
  estado: string;
  estado_label?: string;
  descripcion: string;
  necesita: string[] | null;
  no_recibe: string[] | null;
  capacidad_total: number | null;
  capacidad_ocupada: number | null;
  emergencia: boolean;
  zona: { id: number; slug: string; nombre: string } | null;
};

export type ApiProfesionalDocumento = {
  id: number;
  nombre_original: string;
  mime: string | null;
  url: string | null;
};

export type ApiProfesional = {
  id: number;
  area: string;
  area_label?: string;
  nombre: string;
  titulo: string;
  inicial: string | null;
  modalidad: string;
  modalidad_label?: string;
  disponibilidad: string;
  descripcion: string;
  estado: string;
  estado_label?: string;
  email: string | null;
  celular: string | null;
  zona: { id: number; slug: string; nombre: string } | null;
  /** Solo dueño o moderador (P31) */
  documentos?: ApiProfesionalDocumento[] | null;
};

export type Paginated<T> = {
  data: T[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links?: unknown;
};

export type ApiProfile = {
  id: number;
  name: string;
  email: string;
  celular: string | null;
  zona_id: number | null;
  zona: { id: number; slug: string; nombre: string } | null;
  municipio_id?: number | null;
  municipio?: {
    id: number;
    slug: string;
    nombre: string;
    departamento?: { id: number; slug: string; nombre: string } | null;
  } | null;
  genero: string | null;
  edad: number | null;
  aptitud_fisica: string | null;
  notas_salud: string | null;
  inicial: string | null;
  habilidades: Array<{ id: number; nombre: string; tipo: string | null }>;
  disponibilidades: Array<{ id: number; nombre: string }>;
  roles: string[];
  permissions: string[];
};

export type ApiHabilidad = {
  id: number;
  slug: string;
  nombre: string;
  tipo: string;
};

export type ApiDisponibilidad = {
  id: number;
  slug: string;
  nombre: string;
};
