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
  payload: Record<string, unknown>,
) {
  return apiFetch<{ data: ApiProfesional }>(
    "/api/profesionales",
    { method: "POST", body: JSON.stringify(payload) },
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

// silence unused for now — used by client components via getStoredToken
void authOpts;
