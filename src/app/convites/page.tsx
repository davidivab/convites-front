import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ConvitesClient } from "./convites-client";
import { ConvitesIntro } from "./convites-intro";
import {
  fetchCatalogos,
  fetchDepartamentos,
  fetchIniciativasMapa,
  fetchIniciativasPage,
  fetchMaterialesPage,
  fetchMunicipios,
  type PageMeta,
} from "@/lib/convites-api";
import { sortGeoCatalog } from "@/lib/geo-sort";
import type { Iniciativa } from "@/lib/data";
import type { ApiMaterial, ApiMunicipio, ApiZona } from "@/lib/types";
import type { GeoOption, MapaPin } from "./convites-types";

export type { GeoOption, MapaPin } from "./convites-types";

export const metadata = {
  title: "Ver convites abiertos en Colombia",
  description:
    "Iniciativas comunitarias abiertas en las zonas afectadas de Colombia. Filtra por municipio, categoría o material y súmate con lo que puedas aportar.",
  alternates: { canonical: "/convites" },
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
  for (const m of sortGeoCatalog(municipios)) {
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

export default async function ConvitesPage({
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

    if (seccion === "materiales" && vista === "lista") {
      const res = await fetchMaterialesPage(filterParams);
      materiales = res.data;
      meta = res.meta;
    } else if (vista === "mapa") {
      // Mapa de convites (en materiales: solo los que piden ítems del filtro)
      let pins = await fetchIniciativasMapa({
        zona: geo.zona,
        municipio: geo.municipio,
        categoria: filterParams.categoria,
        urgencia: filterParams.urgencia,
        q: seccion === "convites" ? filterParams.q : undefined,
        server: true,
      });

      if (seccion === "materiales") {
        const mats = await fetchMaterialesPage({
          ...filterParams,
          per_page: 50,
          page: 1,
          orden: undefined,
          dir: undefined,
        });
        const slugs = new Set(mats.data.map((m) => m.iniciativa.slug));
        pins = pins.filter((p) => slugs.has(p.slug));
        meta = {
          current_page: 1,
          last_page: 1,
          total: mats.meta.total,
          per_page: mats.meta.per_page,
        };
      } else {
        meta = {
          current_page: 1,
          last_page: 1,
          total: pins.length,
          per_page: pins.length || PER_PAGE,
        };
      }
      mapaPins = pins.map((p) => ({
        id: String(p.id),
        slug: p.slug,
        titulo: p.titulo,
        lat: p.lat,
        lng: p.lng,
      }));
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
        <ConvitesIntro />

        <ConvitesClient
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
