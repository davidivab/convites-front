import { apiFetch, getStoredTokenSafe } from "@/lib/api";
import { mapCentro, mapIniciativa, mapProfesional } from "@/lib/mappers";
import type {
  ApiAporte,
  ApiAvance,
  ApiAvanceList,
  ApiAvanceMedia,
  ApiCategoria,
  ApiCentro,
  ApiDepartamento,
  ApiDisponibilidad,
  ApiHabilidad,
  ApiIniciativa,
  ApiMaterial,
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
  municipio?: string;
  departamento?: string;
  categoria?: string;
  urgencia?: string;
  q?: string;
  orden?: "fecha" | "avance" | "nombre";
  dir?: "asc" | "desc";
  page?: number;
  per_page?: number;
  token?: string | null;
  server?: boolean;
  revalidate?: number;
}): Promise<Iniciativa[]> {
  const res = await fetchIniciativasPage(params);
  return res.data;
}

export type PageMeta = {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
};

export async function fetchIniciativasPage(params?: {
  destacadas?: boolean;
  zona?: string;
  municipio?: string;
  departamento?: string;
  categoria?: string;
  urgencia?: string;
  q?: string;
  orden?: "fecha" | "avance" | "nombre";
  dir?: "asc" | "desc";
  page?: number;
  per_page?: number;
  token?: string | null;
  server?: boolean;
  revalidate?: number;
}): Promise<{ data: Iniciativa[]; meta: PageMeta }> {
  const qs = new URLSearchParams();
  if (params?.destacadas) qs.set("destacadas", "1");
  if (params?.zona) qs.set("zona", params.zona);
  if (params?.municipio) qs.set("municipio", params.municipio);
  if (params?.departamento) qs.set("departamento", params.departamento);
  if (params?.categoria) qs.set("categoria", params.categoria);
  if (params?.urgencia) qs.set("urgencia", params.urgencia);
  if (params?.q) qs.set("q", params.q);
  if (params?.orden) qs.set("orden", params.orden);
  if (params?.dir) qs.set("dir", params.dir);
  qs.set("per_page", String(params?.per_page ?? 12));
  if (params?.page) qs.set("page", String(params.page));

  const path = `/api/iniciativas?${qs.toString()}`;
  const res = await apiFetch<Paginated<ApiIniciativa>>(path, {}, {
    server: params?.server,
    token: params?.token,
    revalidate: params?.revalidate,
  });
  return {
    data: (res.data ?? []).map(mapIniciativa),
    meta: {
      current_page: res.meta?.current_page ?? 1,
      last_page: res.meta?.last_page ?? 1,
      total: res.meta?.total ?? (res.data ?? []).length,
      per_page: res.meta?.per_page ?? params?.per_page ?? 12,
    },
  };
}

/** Listado liviano para el mapa de /convites (no paginado). */
export async function fetchIniciativasMapa(params?: {
  zona?: string;
  municipio?: string;
  departamento?: string;
  categoria?: string;
  urgencia?: string;
  q?: string;
  token?: string | null;
  server?: boolean;
}): Promise<
  Array<{
    id: string;
    slug: string;
    titulo: string;
    urgencia?: string;
    lat: number;
    lng: number;
    zonaNombre?: string;
  }>
> {
  const qs = new URLSearchParams();
  if (params?.zona) qs.set("zona", params.zona);
  if (params?.municipio) qs.set("municipio", params.municipio);
  if (params?.departamento) qs.set("departamento", params.departamento);
  if (params?.categoria) qs.set("categoria", params.categoria);
  if (params?.urgencia) qs.set("urgencia", params.urgencia);
  if (params?.q) qs.set("q", params.q);
  const res = await apiFetch<{
    data: Array<{
      id: number;
      slug: string;
      titulo: string;
      urgencia?: string;
      lat: number;
      lng: number;
      zona?: { nombre: string } | null;
    }>;
  }>(`/api/iniciativas/mapa?${qs.toString()}`, {}, {
    server: params?.server,
    token: params?.token,
  });
  return (res.data ?? []).map((row) => ({
    id: String(row.id),
    slug: row.slug,
    titulo: row.titulo,
    urgencia: row.urgencia,
    lat: row.lat,
    lng: row.lng,
    zonaNombre: row.zona?.nombre,
  }));
}

/** Búsqueda inversa: materiales que aún faltan en convites abiertos. */
export async function fetchMateriales(params?: {
  zona?: string;
  municipio?: string;
  departamento?: string;
  categoria?: string;
  urgencia?: string;
  q?: string;
  orden?: "fecha" | "avance" | "nombre";
  dir?: "asc" | "desc";
  per_page?: number;
  page?: number;
  token?: string | null;
  server?: boolean;
  revalidate?: number;
}): Promise<ApiMaterial[]> {
  const res = await fetchMaterialesPage(params);
  return res.data;
}

export async function fetchMaterialesPage(params?: {
  zona?: string;
  municipio?: string;
  departamento?: string;
  categoria?: string;
  urgencia?: string;
  q?: string;
  orden?: "fecha" | "avance" | "nombre";
  dir?: "asc" | "desc";
  per_page?: number;
  page?: number;
  token?: string | null;
  server?: boolean;
  revalidate?: number;
}): Promise<{ data: ApiMaterial[]; meta: PageMeta }> {
  const qs = new URLSearchParams();
  if (params?.zona) qs.set("zona", params.zona);
  if (params?.municipio) qs.set("municipio", params.municipio);
  if (params?.departamento) qs.set("departamento", params.departamento);
  if (params?.categoria) qs.set("categoria", params.categoria);
  if (params?.urgencia) qs.set("urgencia", params.urgencia);
  if (params?.q) qs.set("q", params.q);
  if (params?.orden) qs.set("orden", params.orden);
  if (params?.dir) qs.set("dir", params.dir);
  qs.set("per_page", String(params?.per_page ?? 12));
  if (params?.page) qs.set("page", String(params.page));

  const res = await apiFetch<Paginated<ApiMaterial>>(
    `/api/materiales?${qs.toString()}`,
    {},
    {
      server: params?.server,
      token: params?.token,
      revalidate: params?.revalidate,
    },
  );
  return {
    data: res.data ?? [],
    meta: {
      current_page: res.meta?.current_page ?? 1,
      last_page: res.meta?.last_page ?? 1,
      total: res.meta?.total ?? (res.data ?? []).length,
      per_page: res.meta?.per_page ?? params?.per_page ?? 12,
    },
  };
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

/** Raw API shape (incluye version / verificacion para owner). */
export async function fetchIniciativaApi(
  slug: string,
  token?: string | null,
): Promise<ApiIniciativa> {
  const res = await apiFetch<{ data: ApiIniciativa }>(
    `/api/iniciativas/${encodeURIComponent(slug)}`,
    {},
    { token },
  );
  return res.data;
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

export async function updateIniciativa(
  token: string,
  id: string | number,
  payload: Record<string, unknown>,
): Promise<ApiIniciativa> {
  const res = await apiFetch<{ data: ApiIniciativa }>(
    `/api/iniciativas/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
    { token },
  );
  return res.data;
}

export async function uploadIniciativaPortada(
  token: string,
  id: string | number,
  blob: Blob,
  filename = "portada.jpg",
): Promise<ApiIniciativa> {
  const form = new FormData();
  form.append("imagen", blob, filename);
  const res = await apiFetch<{ data: ApiIniciativa }>(
    `/api/iniciativas/${id}/imagen-portada`,
    { method: "POST", body: form },
    { token },
  );
  return res.data;
}

export async function uploadIniciativaGaleria(
  token: string,
  id: string | number,
  blob: Blob,
  filename = "foto.jpg",
): Promise<{
  id: number;
  url: string;
  orden: number;
  ancho: number;
  alto: number;
  version: number;
}> {
  const form = new FormData();
  form.append("imagen", blob, filename);
  const res = await apiFetch<{
    data: {
      id: number;
      url: string;
      orden: number;
      ancho: number;
      alto: number;
      version: number;
    };
  }>(`/api/iniciativas/${id}/galeria`, { method: "POST", body: form }, { token });
  return res.data;
}

export async function deleteIniciativaGaleria(
  token: string,
  iniciativaId: string | number,
  galeriaId: string | number,
): Promise<ApiIniciativa> {
  const res = await apiFetch<{ data: ApiIniciativa }>(
    `/api/iniciativas/${iniciativaId}/galeria/${galeriaId}`,
    { method: "DELETE" },
    { token },
  );
  return res.data;
}

// ---------------------------------------------------------------------------
// Avances (P54) — iniciativa identificada por uuid, no por slug de URL
// ---------------------------------------------------------------------------

export type AvancePayload = {
  titulo: string;
  cuerpo?: string | null;
  tipo: "general" | "item";
  iniciativa_item_id?: number | null;
  porcentaje?: number | null;
  enlace_externo?: string | null;
  notificar_aportantes?: boolean;
  publicado?: boolean;
};

export async function fetchAvances(
  iniciativaUuid: string,
  opts?: { limit?: number; page?: number; server?: boolean },
): Promise<ApiAvanceList> {
  const qs = new URLSearchParams();
  if (opts?.limit) qs.set("limit", String(opts.limit));
  if (opts?.page) qs.set("page", String(opts.page));
  const q = qs.toString() ? `?${qs}` : "";
  return apiFetch<ApiAvanceList>(
    `/api/iniciativas/${encodeURIComponent(iniciativaUuid)}/avances${q}`,
    {},
    {
      server: opts?.server,
      revalidate: opts?.server ? 60 : undefined,
    },
  );
}

export async function fetchAvance(
  iniciativaUuid: string,
  avanceSlug: string,
  opts?: { server?: boolean },
): Promise<ApiAvance> {
  const res = await apiFetch<{ data: ApiAvance }>(
    `/api/iniciativas/${encodeURIComponent(iniciativaUuid)}/avances/${encodeURIComponent(avanceSlug)}`,
    {},
    {
      server: opts?.server,
      revalidate: opts?.server ? 60 : undefined,
    },
  );
  return res.data;
}

export async function createAvance(
  token: string,
  iniciativaUuid: string,
  payload: AvancePayload,
): Promise<ApiAvance> {
  const res = await apiFetch<{ data: ApiAvance }>(
    `/api/iniciativas/${encodeURIComponent(iniciativaUuid)}/avances`,
    { method: "POST", body: JSON.stringify(payload) },
    { token },
  );
  return res.data;
}

export async function updateAvance(
  token: string,
  iniciativaUuid: string,
  avanceId: number,
  payload: Partial<AvancePayload>,
): Promise<ApiAvance> {
  const res = await apiFetch<{ data: ApiAvance }>(
    `/api/iniciativas/${encodeURIComponent(iniciativaUuid)}/avances/${avanceId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    { token },
  );
  return res.data;
}

export async function deleteAvance(
  token: string,
  iniciativaUuid: string,
  avanceId: number,
): Promise<void> {
  await apiFetch<void>(
    `/api/iniciativas/${encodeURIComponent(iniciativaUuid)}/avances/${avanceId}`,
    { method: "DELETE" },
    { token },
  );
}

export async function uploadAvanceMedia(
  token: string,
  iniciativaUuid: string,
  avanceId: number,
  file: Blob,
  filename: string,
): Promise<ApiAvanceMedia> {
  const form = new FormData();
  form.append("archivo", file, filename);
  const res = await apiFetch<{ data: ApiAvanceMedia }>(
    `/api/iniciativas/${encodeURIComponent(iniciativaUuid)}/avances/${avanceId}/media`,
    { method: "POST", body: form },
    { token },
  );
  return res.data;
}

export async function deleteAvanceMedia(
  token: string,
  iniciativaUuid: string,
  avanceId: number,
  mediaId: number,
): Promise<void> {
  await apiFetch<void>(
    `/api/iniciativas/${encodeURIComponent(iniciativaUuid)}/avances/${avanceId}/media/${mediaId}`,
    { method: "DELETE" },
    { token },
  );
}

/** P43: owner o moderador cierra convite publicada/en_curso */
export async function cerrarIniciativa(
  token: string,
  id: string | number,
  nota?: string,
): Promise<Iniciativa> {
  const res = await apiFetch<{ data: ApiIniciativa }>(
    `/api/iniciativas/${id}/cerrar`,
    {
      method: "POST",
      body: JSON.stringify(nota ? { nota } : {}),
    },
    { token },
  );
  return mapIniciativa(res.data);
}

export async function enviarRevision(
  token: string,
  id: string | number,
): Promise<Iniciativa> {
  const res = await apiFetch<{ data: ApiIniciativa }>(
    `/api/iniciativas/${id}/enviar-revision`,
    { method: "POST" },
    { token },
  );
  return mapIniciativa(res.data);
}

export async function crearAporte(
  token: string,
  iniciativaId: string | number,
  payload: {
    asiste_al_convite?: boolean;
    nota?: string;
    anonimo?: boolean;
    punto_acopio_id?: number;
    proveedor_id?: number;
    /** Fecha en la que el aportante planea entregar (YYYY-MM-DD), opcional. */
    fecha_entrega?: string;
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

/** P39: borra solo el archivo; el estado del aporte no cambia. */
export async function eliminarEvidenciaAporte(
  token: string,
  aporteId: number,
): Promise<ApiAporte> {
  const res = await apiFetch<{ data: ApiAporte }>(
    `/api/aportes/${aporteId}/evidencia`,
    { method: "DELETE" },
    { token },
  );
  return res.data;
}

/** El aportante sube su propia evidencia de entrega (distinta a la del organizador). */
export async function subirEvidenciaPropia(
  token: string,
  aporteId: number,
  file: Blob,
) {
  const form = new FormData();
  form.append("evidencia", file);
  return apiFetch<{ data: ApiAporte }>(
    `/api/aportes/${aporteId}/evidencia-propia`,
    { method: "POST", body: form },
    { token },
  );
}

/** El aportante elimina su propia evidencia de entrega. */
export async function eliminarEvidenciaPropia(
  token: string,
  aporteId: number,
): Promise<ApiAporte> {
  const res = await apiFetch<{ data: ApiAporte }>(
    `/api/aportes/${aporteId}/evidencia-propia`,
    { method: "DELETE" },
    { token },
  );
  return res.data;
}

export async function cancelarAporte(token: string, aporteId: number) {
  return apiFetch<{ data: ApiAporte }>(
    `/api/aportes/${aporteId}/cancelar`,
    { method: "POST" },
    { token },
  );
}

export async function fetchDepartamentos(
  server = false,
  opts?: { incluirInactivos?: boolean },
): Promise<ApiDepartamento[]> {
  // Producto: catálogo nacional completo (33 deptos / ~1122 municipios).
  // `incluirInactivos: false` solo si hace falta el subset “activo” legacy.
  const incluir = opts?.incluirInactivos !== false;
  const q = incluir ? "?incluir_inactivos=1" : "";
  const res = await apiFetch<{ data: ApiDepartamento[] }>(
    `/api/catalogos/departamentos${q}`,
    {},
    { server, revalidate: server ? 3600 : undefined },
  );
  return res.data ?? [];
}

export async function fetchMunicipios(
  departamentoId: number,
  server = false,
  opts?: { incluirInactivos?: boolean },
): Promise<ApiMunicipio[]> {
  const incluir = opts?.incluirInactivos !== false;
  const params = new URLSearchParams({
    departamento_id: String(departamentoId),
  });
  if (incluir) params.set("incluir_inactivos", "1");
  const res = await apiFetch<{ data: ApiMunicipio[] }>(
    `/api/catalogos/municipios?${params}`,
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
  params?: {
    role?: "moderator" | "voluntario" | "admin" | "member" | "profesional";
    /** Lista todos los registrados (ciudadanos incl. solo `member`). */
    todos?: boolean;
    /** @deprecated Preferir `todos` — el API ya no usa scope. */
    scope?: "all" | "staff";
    q?: string;
    sort?: "name" | "email" | "created_at";
    order?: "asc" | "desc";
    per_page?: number;
    page?: number;
  },
): Promise<{
  data: ApiAdminUser[];
  meta?: { current_page?: number; last_page?: number; total?: number };
}> {
  const qs = new URLSearchParams();
  if (params?.role) qs.set("role", params.role);
  if (params?.todos || params?.scope === "all") qs.set("todos", "1");
  if (params?.q?.trim()) qs.set("q", params.q.trim());
  if (params?.sort) qs.set("sort", params.sort);
  if (params?.order) qs.set("order", params.order);
  if (params?.per_page) qs.set("per_page", String(params.per_page));
  if (params?.page) qs.set("page", String(params.page));
  const q = qs.toString() ? `?${qs}` : "";
  const res = await apiFetch<Paginated<ApiAdminUser>>(
    `/api/admin/users${q}`,
    {},
    { token },
  );
  return {
    data: res.data ?? [],
    meta: res.meta
      ? {
          current_page: res.meta.current_page,
          last_page: res.meta.last_page,
          total: res.meta.total,
        }
      : undefined,
  };
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
    page?: number;
  },
): Promise<{ data: ApiIniciativa[]; meta?: { current_page?: number; last_page?: number; total?: number } }> {
  const sp = new URLSearchParams();
  if (params?.estado) sp.set("estado", params.estado);
  if (params?.municipio_id) sp.set("municipio_id", String(params.municipio_id));
  if (params?.q) sp.set("q", params.q);
  if (params?.urgencia) sp.set("urgencia", params.urgencia);
  if (params?.per_page) sp.set("per_page", String(params.per_page));
  if (params?.page) sp.set("page", String(params.page));
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
  estado_label?: string | null;
  /** Texto acumulado de notas (log con fechas) */
  nota?: string | null;
  created_at: string | null;
};

export type EstadoSolicitudProfesional =
  | "pendiente"
  | "notificada"
  | "atendida"
  | "negada"
  | "trasladada"
  | "no_contesta"
  | "spam";

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

export async function patchSolicitudProfesional(
  token: string,
  solicitudId: number,
  payload: { estado?: EstadoSolicitudProfesional; nota?: string },
): Promise<ApiProfesionalSolicitud> {
  const res = await apiFetch<{ data: ApiProfesionalSolicitud }>(
    `/api/mi-perfil-profesional/solicitudes/${solicitudId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    { token },
  );
  return res.data;
}

/** P46 — solicitud de rol moderador | voluntario */
export type RolSolicitable = "moderador" | "voluntario";

export type EstadoSolicitudRol = "pendiente" | "aprobada" | "rechazada";

export type ApiSolicitudRol = {
  id: number;
  rol: RolSolicitable;
  estado: EstadoSolicitudRol;
  mensaje: string | null;
  nota_revision: string | null;
  municipios: Array<{ id: number; nombre: string; slug?: string }>;
  user?: { id: number; name: string; email: string } | null;
  created_at: string | null;
  revisado_at: string | null;
};

export async function fetchMisSolicitudesRol(
  token: string,
): Promise<ApiSolicitudRol[]> {
  const res = await apiFetch<{ data: ApiSolicitudRol[] } | Paginated<ApiSolicitudRol>>(
    "/api/mis-solicitudes-rol",
    {},
    { token },
  );
  if (Array.isArray(res)) return res;
  if ("data" in res && Array.isArray(res.data)) return res.data;
  return [];
}

export async function crearSolicitudRol(
  token: string,
  payload: {
    rol: RolSolicitable;
    municipio_ids: number[];
    mensaje?: string;
  },
): Promise<ApiSolicitudRol> {
  const res = await apiFetch<{ data: ApiSolicitudRol }>(
    "/api/solicitudes-rol",
    { method: "POST", body: JSON.stringify(payload) },
    { token },
  );
  return res.data;
}

export async function fetchAdminSolicitudesRol(
  token: string,
  params?: { estado?: EstadoSolicitudRol; rol?: RolSolicitable },
): Promise<ApiSolicitudRol[]> {
  const q = new URLSearchParams();
  if (params?.estado) q.set("estado", params.estado);
  if (params?.rol) q.set("rol", params.rol);
  const qs = q.toString();
  const res = await apiFetch<
    { data: ApiSolicitudRol[] } | Paginated<ApiSolicitudRol>
  >(`/api/admin/solicitudes-rol${qs ? `?${qs}` : ""}`, {}, { token });
  if ("data" in res && Array.isArray(res.data)) return res.data;
  return [];
}

export async function aprobarSolicitudRol(
  token: string,
  id: number,
): Promise<ApiSolicitudRol> {
  const res = await apiFetch<{ data: ApiSolicitudRol }>(
    `/api/admin/solicitudes-rol/${id}/aprobar`,
    { method: "POST", body: JSON.stringify({}) },
    { token },
  );
  return res.data;
}

export async function rechazarSolicitudRol(
  token: string,
  id: number,
  nota_revision: string,
): Promise<ApiSolicitudRol> {
  const res = await apiFetch<{ data: ApiSolicitudRol }>(
    `/api/admin/solicitudes-rol/${id}/rechazar`,
    { method: "POST", body: JSON.stringify({ nota_revision }) },
    { token },
  );
  return res.data;
}

export type ApiEstadisticasDia = { fecha: string; total: number };

export type ApiEstadisticasEstado = {
  estado:
    | "borrador"
    | "en_revision"
    | "publicada"
    | "en_curso"
    | "cerrada"
    | "rechazada";
  total: number;
};

export type ApiAdminEstadisticas = {
  start_date: string;
  end_date: string;
  usuarios_por_dia: ApiEstadisticasDia[];
  convites_por_dia: ApiEstadisticasDia[];
  convites_por_estado: ApiEstadisticasEstado[];
  avance_global: {
    promedio: number;
    convites_considerados: number;
  };
};

/** P51 — `GET /api/admin/estadisticas` */
export async function fetchAdminEstadisticas(
  token: string,
  params?: { start_date?: string; end_date?: string },
): Promise<ApiAdminEstadisticas> {
  const qs = new URLSearchParams();
  if (params?.start_date) qs.set("start_date", params.start_date);
  if (params?.end_date) qs.set("end_date", params.end_date);
  const q = qs.toString() ? `?${qs}` : "";
  return apiFetch<ApiAdminEstadisticas>(
    `/api/admin/estadisticas${q}`,
    {},
    { token },
  );
}

// silence unused for now — used by client components via getStoredToken
void authOpts;
