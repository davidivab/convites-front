import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ExplorarClient } from "./explorar-client";
import { ExplorarIntro } from "./explorar-intro";
import {
  fetchCatalogos,
  fetchDepartamentos,
  fetchIniciativasMapa,
  fetchIniciativasPage,
  fetchMaterialesPage,
  fetchMunicipios,
  type PageMeta,
} from "@/lib/convites-api";
import type { Iniciativa } from "@/lib/data";
import type { ApiMaterial, ApiMunicipio, ApiZona } from "@/lib/types";
import type { GeoOption, MapaPin } from "./explorar-types";

export type { GeoOption, MapaPin } from "./explorar-types";

export const metadata = {
  title: "Explorar convites — Convites",
  description:
    "Iniciativas comunitarias abiertas en las zonas afectadas de Risaralda.",
};

const PER_PAGE = 12;

function one(v: string | string[] | undefined): string | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

function parseOrden(
  raw: string | null,
): "fecha" | "avance" | "nombre" | undefined {
  if (raw === "porcentaje" || raw === "avance") return "avance";
  if (raw === "fecha" || raw === "nombre") return raw;
  return undefined;
}

function parseDir(raw: string | null): "asc" | "desc" | undefined {
  if (raw === "asc" || raw === "desc") return raw;
  return undefined;
}

function parsePage(raw: string | null): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

function buildGeoOptions(
  zonas: ApiZona[],
  municipios: ApiMunicipio[],
): GeoOption[] {
  const zonaLabels = new Set(zonas.map((z) => z.nombre.toLowerCase()));
  const opts: GeoOption[] = [
    { value: "todas", label: "Todas las zonas" },
    ...zonas.map((z) => ({
      value: `zona:${z.slug}`,
      label: z.nombre,
    })),
  ];
  for (const m of municipios) {
    if (zonaLabels.has(m.nombre.toLowerCase())) continue;
    opts.push({
      value: `municipio:${m.slug}`,
      label: m.nombre,
    });
  }
  return opts;
}

function parseGeo(value: string | null): {
  zona?: string;
  municipio?: string;
  geoValue: string;
} {
  if (!value || value === "todas") return { geoValue: "todas" };
  if (value.startsWith("zona:")) {
    return { zona: value.slice(5), geoValue: value };
  }
  if (value.startsWith("municipio:")) {
    return { municipio: value.slice(10), geoValue: value };
  }
  // Compat: slug suelto → zona
  return { zona: value, geoValue: `zona:${value}` };
}

export default async function ExplorarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const seccion = one(sp.seccion) === "materiales" ? "materiales" : "convites";
  const vista = one(sp.vista) === "mapa" ? "mapa" : "lista";
  const q = (one(sp.q) ?? "").trim();
  const categoria = one(sp.categoria);
  const urgencia = one(sp.urgencia);
  const orden = parseOrden(one(sp.orden));
  const dir = parseDir(one(sp.dir));
  const page = parsePage(one(sp.page));
  const geoRaw = one(sp.geo) ?? one(sp.zona);
  const geo = parseGeo(geoRaw);

  const filterParams = {
    zona: geo.zona,
    municipio: geo.municipio,
    categoria: categoria && categoria !== "todas" ? categoria : undefined,
    urgencia: urgencia && urgencia !== "todas" ? urgencia : undefined,
    q: q || undefined,
    orden,
    dir,
    page,
    per_page: PER_PAGE,
    server: true as const,
  };

  let iniciativas: Iniciativa[] = [];
  let materiales: ApiMaterial[] = [];
  let meta: PageMeta = {
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: PER_PAGE,
  };
  let mapaPins: MapaPin[] = [];
  let geoOptions: GeoOption[] = [{ value: "todas", label: "Todas las zonas" }];

  try {
    const [catalogos, departamentos] = await Promise.all([
      fetchCatalogos(true),
      fetchDepartamentos(true),
    ]);
    const munLists = await Promise.all(
      departamentos.map((d) => fetchMunicipios(d.id, true)),
    );
    geoOptions = buildGeoOptions(catalogos.zonas, munLists.flat());

    if (seccion === "materiales") {
      const res = await fetchMaterialesPage(filterParams);
      materiales = res.data;
      meta = res.meta;
    } else if (vista === "mapa") {
      const pins = await fetchIniciativasMapa({
        zona: geo.zona,
        categoria: filterParams.categoria,
        urgencia: filterParams.urgencia,
        q: filterParams.q,
        server: true,
      });
      // Si filtra por municipio, el endpoint mapa aún no lo soporta: fallback listado
      if (geo.municipio) {
        const res = await fetchIniciativasPage({
          ...filterParams,
          per_page: 50,
          page: 1,
          orden: undefined,
          dir: undefined,
        });
        mapaPins = res.data
          .filter((i) => typeof i.lat === "number" && typeof i.lng === "number")
          .map((i) => ({
            id: i.id,
            slug: i.slug,
            titulo: i.titulo,
            lat: i.lat!,
            lng: i.lng!,
          }));
        meta = { ...res.meta, last_page: 1 };
      } else {
        mapaPins = pins;
        meta = {
          current_page: 1,
          last_page: 1,
          total: pins.length,
          per_page: pins.length || PER_PAGE,
        };
      }
    } else {
      const res = await fetchIniciativasPage(filterParams);
      iniciativas = res.data;
      meta = res.meta;
    }
  } catch {
    // vacío
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <ExplorarIntro />

        <ExplorarClient
          iniciativas={iniciativas}
          materiales={materiales}
          mapaPins={mapaPins}
          meta={meta}
          geoOptions={geoOptions}
          applied={{
            seccion,
            vista,
            q,
            geo: geo.geoValue,
            categoria: categoria && categoria !== "todas" ? categoria : "todas",
            urgencia: urgencia && urgencia !== "todas" ? urgencia : "todas",
            orden: orden ?? "fecha",
            dir: dir ?? "asc",
            page: meta.current_page,
          }}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
