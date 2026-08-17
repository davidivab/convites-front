import { apiFetch, getStoredTokenSafe } from "@/lib/api";
import { mapCentro, mapIniciativa, mapProfesional } from "@/lib/mappers";
import type {
  ApiAporte,
  ApiCategoria,
  ApiCentro,
  ApiDepartamento,
  ApiDisponibilidad,
  ApiHabilidad,
  ApiIniciativa,
  ApiMunicipio,
  ApiProfesional,
  ApiProfile,
  ApiZona,
  Paginated,
} from "@/lib/types";
import type { Centro, Iniciativa, Profesional } from "@/lib/data";

function authOpts(token?: string | null) {
  return { token: token ?? getStoredTokenSafe(), server: false as const };
}

export async function fetchIniciativas(params?: {
  destacadas?: boolean;
  zona?: string;
  categoria?: string;
  urgencia?: string;
  q?: string;
  token?: string | null;
  server?: boolean;
  revalidate?: number;
}): Promise<Iniciativa[]> {
  const qs = new URLSearchParams();
  if (params?.destacadas) qs.set("destacadas", "1");
  if (params?.zona) qs.set("zona", params.zona);
  if (params?.categoria) qs.set("categoria", params.categoria);
  if (params?.urgencia) qs.set("urgencia", params.urgencia);
  if (params?.q) qs.set("q", params.q);
  qs.set("per_page", "50");

  const path = `/api/iniciativas?${qs.toString()}`;
  const res = await apiFetch<Paginated<ApiIniciativa>>(path, {}, {
    server: params?.server,
    token: params?.token,
    revalidate: params?.revalidate,
  });
  return (res.data ?? []).map(mapIniciativa);
}

export async function fetchIniciativa(
  slug: string,
  options?: { token?: string | null; server?: boolean },
): Promise<Iniciativa> {
  const res = await apiFetch<{ data: ApiIniciativa }>(
    `/api/iniciativas/${slug}`,
    {},
    { server: options?.server, token: options?.token },
  );
  return mapIniciativa(res.data);
}

export async function fetchMisIniciativas(token: string): Promise<Iniciativa[]> {
  const res = await apiFetch<Paginated<ApiIniciativa>>(
    "/api/mis/iniciativas",
    {},
    { token },
  );
  return (res.data ?? []).map(mapIniciativa);
}

export async function fetchMisAportes(token: string): Promise<ApiAporte[]> {
  const res = await apiFetch<Paginated<ApiAporte>>("/api/mis/aportes", {}, { token });
  return res.data ?? [];
}

export async function createIniciativa(
  token: string,
  payload: Record<string, unknown>,
): Promise<Iniciativa> {
  const res = await apiFetch<{ data: ApiIniciativa }>(
    "/api/iniciativas",
    { method: "POST", body: JSON.stringify(payload) },
    { token },
  );
  return mapIniciativa(res.data);
}

export async function enviarRevision(token: string, id: string | number) {
  return apiFetch<{ data: ApiIniciativa }>(
    `/api/iniciativas/${id}/enviar-revision`,
    { method: "POST" },
    { token },
  );
}

export async function crearAporte(
  token: string,
  iniciativaId: string | number,
  payload: {
    asiste_al_convite?: boolean;
    nota?: string;
    anonimo?: boolean;
    client_request_id?: string;
    items?: Array<{ iniciativa_item_id: number; cantidad: number }>;
  },
) {
  return apiFetch<{ data: ApiAporte }>(
    `/api/iniciativas/${iniciativaId}/aportes`,
    { method: "POST", body: JSON.stringify(payload) },
    { token },
  );
}

export async function fetchAportantes(
  token: string,
  iniciativaId: string | number,
): Promise<ApiAporte[]> {
  const res = await apiFetch<Paginated<ApiAporte>>(
    `/api/iniciativas/${iniciativaId}/aportantes`,
    {},
    { token },
  );
  return res.data ?? [];
}

export async function marcarAporteRecepcion(
  token: string,
  aporteId: number,
  payload: { recibido: boolean; evidencia?: File | null },
) {
  const form = new FormData();
  form.append("recibido", payload.recibido ? "1" : "0");
  if (payload.evidencia) {
    form.append("evidencia", payload.evidencia);
  }
  return apiFetch<{ data: ApiAporte }>(
    `/api/aportes/${aporteId}/recepcion`,
    { method: "POST", body: form },
    { token },
  );
}

export async function cancelarAporte(token: string, aporteId: number) {
  return apiFetch<{ data: ApiAporte }>(
    `/api/aportes/${aporteId}/cancelar`,
    { method: "POST" },
    { token },
  );
}

export async function fetchDepartamentos(server = false): Promise<ApiDepartamento[]> {
  const res = await apiFetch<{ data: ApiDepartamento[] }>(
    "/api/catalogos/departamentos",
    {},
    { server, revalidate: server ? 3600 : undefined },
  );
  return res.data ?? [];
}

export async function fetchMunicipios(
  departamentoId: number,
  server = false,
): Promise<ApiMunicipio[]> {
  const res = await apiFetch<{ data: ApiMunicipio[] }>(
    `/api/catalogos/municipios?departamento_id=${departamentoId}`,
    {},
    { server, revalidate: server ? 3600 : undefined },
  );
  return res.data ?? [];
}

export async function fetchCatalogos(server = true, revalidate = 300) {
  const opts = { server, revalidate: server ? revalidate : undefined };
  const [zonas, categorias, habilidades, disponibilidades] = await Promise.all([
    apiFetch<{ data: ApiZona[] }>("/api/catalogos/zonas", {}, opts),
    apiFetch<{ data: ApiCategoria[] }>("/api/catalogos/categorias", {}, opts),
    apiFetch<{ data: ApiHabilidad[] }>("/api/catalogos/habilidades", {}, opts),
    apiFetch<{ data: ApiDisponibilidad[] }>(
      "/api/catalogos/disponibilidades",
      {},
      opts,
    ),
  ]);
  return {
    zonas: zonas.data ?? [],
    categorias: categorias.data ?? [],
    habilidades: habilidades.data ?? [],
    disponibilidades: disponibilidades.data ?? [],
  };
}

export async function fetchProfile(token: string): Promise<ApiProfile> {
  const res = await apiFetch<{ data: ApiProfile }>("/api/profile", {}, { token });
  return res.data;
}

export async function updateProfile(
  token: string,
  payload: Record<string, unknown>,
): Promise<ApiProfile> {
  const res = await apiFetch<{ data: ApiProfile }>(
    "/api/profile",
    { method: "PUT", body: JSON.stringify(payload) },
    { token },
  );
  return res.data;
}

export async function fetchCentros(
  server = true,
  revalidate = 120,
): Promise<Centro[]> {
  const res = await apiFetch<{ data: ApiCentro[] }>(
    "/api/centros",
    {},
    { server, revalidate: server ? revalidate : undefined },
  );
  return (res.data ?? []).map(mapCentro);
}

export async function fetchProfesionales(
  server = true,
  revalidate = 120,
): Promise<Profesional[]> {
  const res = await apiFetch<Paginated<ApiProfesional>>(
    "/api/profesionales",
    {},
    { server, revalidate: server ? revalidate : undefined },
  );
  return (res.data ?? []).map(mapProfesional);
}

export async function fetchProfesional(
  id: string | number,
  options?: { server?: boolean; token?: string | null },
): Promise<Profesional> {
  const res = await apiFetch<{ data: ApiProfesional }>(
    `/api/profesionales/${id}`,
    {},
    { server: options?.server, token: options?.token },
  );
  return mapProfesional(res.data);
}

export async function fetchModeracionIniciativas(token: string): Promise<Iniciativa[]> {
  const res = await apiFetch<Paginated<ApiIniciativa>>(
    "/api/moderacion/iniciativas",
    {},
    { token },
  );
  return (res.data ?? []).map(mapIniciativa);
}

export async function moderarIniciativa(
  token: string,
  id: string | number,
  accion: "aprobar" | "rechazar" | "solicitar-cambios" | "cerrar",
  body: Record<string, unknown> = {},
) {
  return apiFetch<{ data: ApiIniciativa }>(
    `/api/moderacion/iniciativas/${id}/${accion}`,
    { method: "POST", body: JSON.stringify(body) },
    { token },
  );
}

export async function registrarProfesional(
  token: string,
  payload: {
    municipio_id: number;
    area: string;
    nombre: string;
    titulo: string;
    email: string;
    celular?: string | null;
    tarjeta_profesional?: string | null;
    modalidad: string;
    disponibilidad: string;
    descripcion: string;
    documentos?: File[];
  },
) {
  const form = new FormData();
  form.append("municipio_id", String(payload.municipio_id));
  form.append("area", payload.area);
  form.append("nombre", payload.nombre);
  form.append("titulo", payload.titulo);
  form.append("email", payload.email);
  if (payload.celular) form.append("celular", payload.celular);
  if (payload.tarjeta_profesional) {
    form.append("tarjeta_profesional", payload.tarjeta_profesional);
  }
  form.append("modalidad", payload.modalidad);
  form.append("disponibilidad", payload.disponibilidad);
  form.append("descripcion", payload.descripcion);
  for (const file of payload.documentos ?? []) {
    form.append("documentos[]", file);
  }
  return apiFetch<{ data: ApiProfesional }>(
    "/api/profesionales",
    { method: "POST", body: form },
    { token },
  );
}

export async function contactarProfesional(
  token: string,
  id: string | number,
  payload: Record<string, unknown>,
) {
  return apiFetch(
    `/api/profesionales/${id}/solicitudes`,
    { method: "POST", body: JSON.stringify(payload) },
    { token },
  );
}

export type ApiAdminUser = {
  id: number;
  name: string;
  email: string;
  celular: string | null;
  inicial: string | null;
  roles: string[];
  municipios: Array<{
    id: number;
    nombre: string;
    slug: string;
    departamento?: { id: number; nombre: string; slug: string } | null;
  }>;
  created_at: string | null;
};

export async function fetchAdminUsers(
  token: string,
  role?: "moderator" | "voluntario",
): Promise<ApiAdminUser[]> {
  const q = role ? `?role=${role}` : "";
  const res = await apiFetch<Paginated<ApiAdminUser>>(
    `/api/admin/users${q}`,
    {},
    { token },
  );
  return res.data ?? [];
}

export async function createAdminUser(
  token: string,
  payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    celular?: string | null;
    role: "moderator" | "voluntario";
    municipio_ids: number[];
  },
) {
  return apiFetch<{ data: ApiAdminUser }>(
    "/api/admin/users",
    { method: "POST", body: JSON.stringify(payload) },
    { token },
  );
}

export async function syncAdminUserMunicipios(
  token: string,
  userId: number,
  municipioIds: number[],
) {
  return apiFetch<{ data: ApiAdminUser }>(
    `/api/admin/users/${userId}/municipios`,
    { method: "PUT", body: JSON.stringify({ municipio_ids: municipioIds }) },
    { token },
  );
}

export type ApiAdminIniciativaDetalle = ApiIniciativa & {
  verificacion?: {
    persona_responsable: string | null;
    quien_respalda: string | null;
    telefono_contacto: string | null;
    lugar_exacto: string | null;
  };
  moderacion_historial?: Array<{
    id: number;
    accion: string | null;
    estado_anterior: string | null;
    estado_nuevo: string | null;
    nota: string | null;
    moderador: { id: number; name: string } | null;
    created_at: string | null;
  }>;
};

export async function fetchAdminIniciativas(
  token: string,
  params?: {
    estado?: string;
    municipio_id?: number;
    q?: string;
    urgencia?: string;
    per_page?: number;
  },
): Promise<{ data: ApiIniciativa[]; meta?: { current_page?: number; last_page?: number; total?: number } }> {
  const sp = new URLSearchParams();
  if (params?.estado) sp.set("estado", params.estado);
  if (params?.municipio_id) sp.set("municipio_id", String(params.municipio_id));
  if (params?.q) sp.set("q", params.q);
  if (params?.urgencia) sp.set("urgencia", params.urgencia);
  if (params?.per_page) sp.set("per_page", String(params.per_page));
  const q = sp.toString() ? `?${sp}` : "";
  const res = await apiFetch<Paginated<ApiIniciativa>>(
    `/api/admin/iniciativas${q}`,
    {},
    { token },
  );
  return {
    data: res.data ?? [],
    meta: {
      current_page: res.meta?.current_page,
      last_page: res.meta?.last_page,
      total: res.meta?.total,
    },
  };
}

export async function fetchAdminIniciativa(
  token: string,
  slug: string,
): Promise<ApiAdminIniciativaDetalle> {
  const res = await apiFetch<{ data: ApiAdminIniciativaDetalle }>(
    `/api/admin/iniciativas/${encodeURIComponent(slug)}`,
    {},
    { token },
  );
  return res.data;
}

export async function fetchAdminIniciativaAportes(
  token: string,
  slug: string,
): Promise<ApiAporte[]> {
  const res = await apiFetch<Paginated<ApiAporte>>(
    `/api/admin/iniciativas/${encodeURIComponent(slug)}/aportes`,
    {},
    { token },
  );
  return res.data ?? [];
}

export type ApiNotification = {
  id: string;
  type: string;
  data: {
    tipo?: string;
    mensaje?: string;
    slug?: string;
    titulo?: string;
    iniciativa_id?: number;
    aporte_id?: number;
    municipio_id?: number | null;
    [key: string]: unknown;
  };
  read_at: string | null;
  created_at: string | null;
};

export async function fetchNotifications(
  token: string,
  opts?: { unread?: boolean; per_page?: number },
): Promise<{ data: ApiNotification[]; unread_count: number }> {
  const sp = new URLSearchParams();
  if (opts?.unread) sp.set("unread", "1");
  if (opts?.per_page) sp.set("per_page", String(opts.per_page));
  const q = sp.toString() ? `?${sp}` : "";
  const res = await apiFetch<{
    data: ApiNotification[];
    meta: { unread_count: number };
  }>(`/api/notifications${q}`, {}, { token });
  return {
    data: res.data ?? [],
    unread_count: res.meta?.unread_count ?? 0,
  };
}

export async function markNotificationRead(token: string, id: string) {
  return apiFetch<{ data: { id: string; read_at: string | null } }>(
    `/api/notifications/${encodeURIComponent(id)}/read`,
    { method: "POST" },
    { token },
  );
}

export async function markAllNotificationsRead(token: string) {
  return apiFetch<{ data: { ok: boolean } }>(
    "/api/notifications/read-all",
    { method: "POST" },
    { token },
  );
}

export type ApiMiPerfilProfesional = {
  id: number;
  area: string | null;
  area_label?: string | null;
  nombre: string;
  titulo: string;
  inicial: string | null;
  modalidad: string | null;
  modalidad_label?: string | null;
  disponibilidad: string | null;
  descripcion: string | null;
  estado: string | null;
  estado_label?: string | null;
  email: string | null;
  celular: string | null;
  zona: { id: number; slug: string; nombre: string } | null;
  documentos?: Array<{
    id: number;
    nombre_original: string;
    mime: string | null;
    url: string | null;
  }> | null;
};

export type ApiProfesionalSolicitud = {
  id: number;
  nombre: string;
  celular: string;
  email: string | null;
  preferencia_contacto: string | null;
  mensaje: string;
  estado: string | null;
  created_at: string | null;
};

export async function fetchMiPerfilProfesional(
  token: string,
): Promise<ApiMiPerfilProfesional> {
  const res = await apiFetch<{ data: ApiMiPerfilProfesional }>(
    "/api/mi-perfil-profesional",
    {},
    { token },
  );
  return res.data;
}

export async function updateMiPerfilProfesional(
  token: string,
  payload: {
    titulo?: string;
    celular?: string | null;
    modalidad?: string;
    disponibilidad?: string;
    descripcion?: string;
  },
): Promise<ApiMiPerfilProfesional> {
  const res = await apiFetch<{ data: ApiMiPerfilProfesional }>(
    "/api/mi-perfil-profesional",
    { method: "PUT", body: JSON.stringify(payload) },
    { token },
  );
  return res.data;
}

export async function fetchMisSolicitudesProfesional(
  token: string,
): Promise<ApiProfesionalSolicitud[]> {
  const res = await apiFetch<Paginated<ApiProfesionalSolicitud>>(
    "/api/mi-perfil-profesional/solicitudes",
    {},
    { token },
  );
  return res.data ?? [];
}

// silence unused for now — used by client components via getStoredToken
void authOpts;
