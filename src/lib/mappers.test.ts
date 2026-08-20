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
          descripcion: "Cemento gris para muros",
          valor_unitario_aprox: 25000,
          valor_meta_aprox: 250000,
          valor_aportado_aprox: 50000,
        },
        {
          id: 2,
          nombre: "Ladrillos",
          unidad: "unidades",
          cantidad_meta: 100,
          cantidad_aportada: 10,
          faltante: 90,
          progreso: 10,
          orden: 2,
          descripcion: null,
          valor_unitario_aprox: null,
          valor_meta_aprox: null,
          valor_aportado_aprox: null,
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
    expect(mapped.items[0]?.descripcion).toBe("Cemento gris para muros");
    expect(mapped.items[0]?.valorUnitarioAprox).toBe(25000);
    expect(mapped.items[0]?.valorMetaAprox).toBe(250000);
    expect(mapped.items[0]?.valorAportadoAprox).toBe(50000);
    expect(mapped.items[1]?.descripcion).toBeNull();
    expect(mapped.items[1]?.valorUnitarioAprox).toBeNull();
    expect(mapped.items[1]?.valorMetaAprox).toBeNull();
    expect(mapped.items[1]?.valorAportadoAprox).toBeNull();
    expect(mapped.creador).toBe("Ana");
    expect(mapped.fechaISO).toBe("2026-09-01");
    expect(mapped.fechaLimiteAportesISO).toBeUndefined();
  });

  it("maps fecha_limite_aportes when the API provides it", () => {
    const api = {
      id: 10,
      slug: "convite-test-2",
      titulo: "Titulo",
      resumen: "Resumen",
      historia: [],
      urgencia: "media",
      estado: "publicada",
      imagen_path: null,
      fecha_convite: "2026-09-01",
      fecha_limite_aportes: "2026-08-25",
      fecha_convite_texto: "1 de septiembre",
      lugar_convite: "Salón",
      lugar_exacto: null,
      ubicacion: null,
      zona: { id: 1, slug: "zona", nombre: "Zona" },
      categoria: { id: 1, slug: "vivienda", nombre: "Vivienda" },
      creador: { id: 1, name: "Ana", inicial: "A" },
      enlace_externo: null,
      items: [],
      asistentes_count: 0,
      progreso: 0,
      version: 1,
      destacada: false,
      publicada_at: null,
      created_at: null,
    } satisfies ApiIniciativa;

    const mapped = mapIniciativa(api);
    expect(mapped.fechaLimiteAportesISO).toBe("2026-08-25");
  });

  it("maps proveedores when the API provides them", () => {
    const api = {
      id: 11,
      slug: "convite-test-3",
      titulo: "Titulo",
      resumen: "Resumen",
      historia: [],
      urgencia: "media",
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
      items: [],
      proveedores: [
        {
          id: 1,
          nombre: "Ferretería El Tornillo",
          direccion: "Calle 10 #5-20",
          ciudad: "Medellín",
          correo: "contacto@tornillo.com",
          celular: "3001234567",
          instrucciones_pago: "Transferencia a cuenta 123",
          orden: 1,
        },
        {
          id: 2,
          nombre: "Depósito San José",
          direccion: null,
          ciudad: null,
          correo: null,
          celular: null,
          instrucciones_pago: "Pago en efectivo al recoger",
          orden: 2,
        },
      ],
      asistentes_count: 0,
      progreso: 0,
      version: 1,
      destacada: false,
      publicada_at: null,
      created_at: null,
    } satisfies ApiIniciativa;

    const mapped = mapIniciativa(api);
    expect(mapped.proveedores).toHaveLength(2);
    expect(mapped.proveedores?.[0]).toEqual({
      id: "1",
      nombre: "Ferretería El Tornillo",
      direccion: "Calle 10 #5-20",
      ciudad: "Medellín",
      correo: "contacto@tornillo.com",
      celular: "3001234567",
      instruccionesPago: "Transferencia a cuenta 123",
    });
    expect(mapped.proveedores?.[1]).toEqual({
      id: "2",
      nombre: "Depósito San José",
      direccion: null,
      ciudad: null,
      correo: null,
      celular: null,
      instruccionesPago: "Pago en efectivo al recoger",
    });
  });

  it("maps proveedores to an empty array when absent", () => {
    const api = {
      id: 12,
      slug: "convite-test-4",
      titulo: "Titulo",
      resumen: "Resumen",
      historia: [],
      urgencia: "media",
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
      items: [],
      asistentes_count: 0,
      progreso: 0,
      version: 1,
      destacada: false,
      publicada_at: null,
      created_at: null,
    } satisfies ApiIniciativa;

    const mapped = mapIniciativa(api);
    expect(mapped.proveedores).toEqual([]);
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
