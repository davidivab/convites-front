import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { mapEstado, mapIniciativa } from "@/lib/mappers";
import type { ApiIniciativa } from "@/lib/types";
import { ApiError, apiFetch, getPublicApiUrl, getServerApiUrl } from "@/lib/api";

describe("mapEstado", () => {
  it("maps API snake/kebab estados", () => {
    expect(mapEstado("en_revision")).toBe("en-revision");
    expect(mapEstado("publicada")).toBe("publicada");
    expect(mapEstado("desconocido")).toBe("publicada");
  });
});

describe("mapIniciativa", () => {
  it("maps core fields and version", () => {
    const api = {
      id: 9,
      slug: "convite-test",
      titulo: "Titulo",
      resumen: "Resumen",
      historia: ["a"],
      urgencia: "alta",
      estado: "publicada",
      imagen_path: null,
      fecha_convite: "2026-09-01",
      fecha_limite_aportes: null,
      fecha_convite_texto: "1 de septiembre",
      lugar_convite: "Salón",
      lugar_exacto: null,
      ubicacion: null,
      zona: { id: 1, slug: "zona", nombre: "Zona" },
      categoria: { id: 1, slug: "vivienda", nombre: "Vivienda" },
      creador: { id: 1, name: "Ana", inicial: "A" },
      enlace_externo: null,
      items: [
        {
          id: 1,
          nombre: "Cemento",
          unidad: "bultos",
          cantidad_meta: 10,
          cantidad_aportada: 2,
          faltante: 8,
          progreso: 20,
          orden: 1,
        },
      ],
      asistentes_count: 3,
      progreso: 20,
      version: 4,
      destacada: false,
      publicada_at: null,
      created_at: null,
    } satisfies ApiIniciativa;

    const mapped = mapIniciativa(api);
    expect(mapped.id).toBe("9");
    expect(mapped.version).toBe(4);
    expect(mapped.items[0]?.meta).toBe(10);
    expect(mapped.items[0]?.aportado).toBe(2);
    expect(mapped.creador).toBe("Ana");
  });
});

describe("apiFetch", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllGlobals();
  });

  it("uses public API URL when not on server", async () => {
    await apiFetch("/api/centros");
    expect(fetch).toHaveBeenCalled();
    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    // In node test env there is no window → public URL
    expect(url).toBe(`${getPublicApiUrl()}/api/centros`);
  });

  it("uses server API URL with revalidate option", async () => {
    await apiFetch("/api/centros", {}, { server: true, revalidate: 60 });
    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toBe(`${getServerApiUrl()}/api/centros`);
  });

  it("throws ApiError on non-OK", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ message: "Nope" }), { status: 422 }),
      ),
    );
    await expect(apiFetch("/api/x")).rejects.toBeInstanceOf(ApiError);
  });
});
