"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Minus,
  Plus,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";
import { progresoItem, type Iniciativa } from "@/lib/data";
import { crearAporte } from "@/lib/convites-api";
import { ApiError } from "@/lib/api";
import { formatCOP } from "@/lib/format";
import { rememberAuthNext } from "@/lib/auth-next";
import {
  clearAporteDraft,
  loadAporteDraft,
  saveAporteDraft,
} from "@/lib/aporte-draft";

const STEPS = [
  { n: 1, label: "Insumos" },
  { n: 2, label: "Fecha" },
  { n: 3, label: "Entrega" },
  { n: 4, label: "Confirmar" },
] as const;

function clampPaso(raw: string | null | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 1;
  return Math.min(4, Math.max(1, Math.floor(n)));
}

function formatFechaEntrega(value: string): string {
  try {
    return new Date(value).toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

export function AportarClient({ iniciativa }: { iniciativa: Iniciativa }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-muted-foreground">
          Cargando…
        </div>
      }
    >
      <AportarClientInner iniciativa={iniciativa} />
    </Suspense>
  );
}

function AportarClientInner({ iniciativa }: { iniciativa: Iniciativa }) {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pasoParam = searchParams.get("paso");

  const tienePuntos = (iniciativa.puntosAcopio?.length ?? 0) > 0;
  const tieneProveedores = (iniciativa.proveedores?.length ?? 0) > 0;
  const tienePaso3 = tienePuntos || tieneProveedores;

  const [paso, setPaso] = useState(() => clampPaso(pasoParam));
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [asisto, setAsisto] = useState(true);
  const [anonimo, setAnonimo] = useState(false);
  const [puntoAcopioId, setPuntoAcopioId] = useState<string>("");
  const [comproDeProveedor, setComproDeProveedor] = useState(false);
  const [proveedorId, setProveedorId] = useState<string>("");
  const [fechaEntrega, setFechaEntrega] = useState<string>("");
  const [confirmado, setConfirmado] = useState(false);
  const [mostrarCompromiso, setMostrarCompromiso] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  function aportePath(p: number) {
    return `/iniciativa/${iniciativa.slug}/aportar?paso=${p}`;
  }

  function syncUrl(nextPaso: number) {
    const p = clampPaso(String(nextPaso));
    const resolved = !tienePaso3 && p === 3 ? 4 : p;
    setPaso(resolved);
    router.replace(aportePath(resolved), { scroll: false });
  }

  useEffect(() => {
    const fromUrl = clampPaso(pasoParam);
    const resolved = !tienePaso3 && fromUrl === 3 ? 4 : fromUrl;
    if (resolved !== paso) setPaso(resolved);
    if (!pasoParam || resolved !== fromUrl) {
      router.replace(aportePath(resolved), { scroll: false });
    }
    // Solo al montar / cambiar query
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasoParam, tienePaso3]);

  useEffect(() => {
    // Esperar auth para no borrar el draft antes de saber si hay token
    // (openCompromiso solo tiene sentido con sesión).
    if (loading) return;
    const draft = loadAporteDraft(iniciativa.slug);
    if (!draft) return;
    setCantidades(draft.cantidades ?? {});
    setAsisto(draft.asisto ?? true);
    setAnonimo(draft.anonimo ?? false);
    setPuntoAcopioId(draft.puntoAcopioId ?? "");
    setComproDeProveedor(draft.comproDeProveedor ?? false);
    setProveedorId(draft.proveedorId ?? "");
    setFechaEntrega(draft.fechaEntrega ?? "");
    const draftPaso = clampPaso(
      draft.paso != null ? String(draft.paso) : pasoParam,
    );
    const resolved = !tienePaso3 && draftPaso === 3 ? 4 : draftPaso;
    syncUrl(resolved);
    if (draft.openCompromiso && token) {
      setMostrarCompromiso(true);
    }
    clearAporteDraft(iniciativa.slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iniciativa.slug, token, loading]);

  function persistDraftAndGoAuth(opts?: { openCompromiso?: boolean }) {
    const path = aportePath(paso);
    saveAporteDraft(iniciativa.slug, {
      cantidades,
      asisto,
      anonimo,
      puntoAcopioId,
      comproDeProveedor,
      proveedorId,
      fechaEntrega,
      paso,
      openCompromiso: opts?.openCompromiso ?? true,
    });
    rememberAuthNext(path);
    router.push(`/ingresar?next=${encodeURIComponent(path)}`);
  }

  function setCantidad(id: string, valor: number) {
    setCantidades((prev) => ({ ...prev, [id]: Math.max(0, valor) }));
  }

  const seleccionados = useMemo(
    () =>
      iniciativa.items
        .map((item) => ({ item, cantidad: cantidades[item.id] ?? 0 }))
        .filter((s) => s.cantidad > 0),
    [iniciativa.items, cantidades],
  );

  const totalItems = seleccionados.reduce((acc, s) => acc + s.cantidad, 0);
  const puedeConfirmar =
    (totalItems > 0 || asisto) && !(comproDeProveedor && !proveedorId);

  const proveedorSeleccionado = iniciativa.proveedores?.find(
    (p) => p.id === proveedorId,
  );

  const minFechaEntrega = new Date().toISOString().slice(0, 10);
  const maxFechaEntrega =
    iniciativa.fechaLimiteAportesISO || iniciativa.fechaISO || undefined;

  function nextPasoFrom(current: number): number {
    if (current === 2 && !tienePaso3) return 4;
    return Math.min(4, current + 1);
  }

  function prevPasoFrom(current: number): number {
    if (current === 4 && !tienePaso3) return 2;
    return Math.max(1, current - 1);
  }

  function puedeAvanzarDesde(current: number): boolean {
    if (current === 1) return true;
    if (current === 2) return totalItems > 0 || asisto;
    if (current === 3) {
      if (comproDeProveedor && !proveedorId) return false;
      return true;
    }
    return puedeConfirmar;
  }

  function onContinuar() {
    setStepError(null);
    if (paso === 2 && !(totalItems > 0 || asisto)) {
      setStepError(
        "Elige al menos un insumo en el paso anterior o confirma que vas a asistir.",
      );
      return;
    }
    if (paso === 3 && comproDeProveedor && !proveedorId) {
      setStepError("Elige un proveedor o desmarca esa opción.");
      return;
    }
    syncUrl(nextPasoFrom(paso));
  }

  function onAtras() {
    setStepError(null);
    syncUrl(prevPasoFrom(paso));
  }

  function pedirConfirmacion() {
    if (!puedeConfirmar) {
      setStepError("Revisa tu selección antes de confirmar.");
      return;
    }
    if (!token) {
      persistDraftAndGoAuth({ openCompromiso: true });
      return;
    }
    setError(null);
    setMostrarCompromiso(true);
  }

  async function confirmar() {
    if (!token) {
      persistDraftAndGoAuth({ openCompromiso: true });
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await crearAporte(token, iniciativa.id, {
        asiste_al_convite: asisto,
        anonimo,
        ...(puntoAcopioId ? { punto_acopio_id: Number(puntoAcopioId) } : {}),
        ...(comproDeProveedor && proveedorId
          ? { proveedor_id: Number(proveedorId) }
          : {}),
        ...(fechaEntrega ? { fecha_entrega: fechaEntrega } : {}),
        client_request_id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `aporte-${Date.now()}`,
        items: seleccionados.map(({ item, cantidad }) => ({
          iniciativa_item_id: Number(item.id),
          cantidad,
        })),
      });
      setMostrarCompromiso(false);
      setConfirmado(true);
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.body.message || "No pudimos registrar tu aporte."
          : e instanceof Error
            ? e.message
            : "No pudimos registrar tu aporte.";
      setError(message);
      setMostrarCompromiso(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmado) {
    return (
      <Confirmacion
        iniciativa={iniciativa}
        seleccionados={seleccionados}
        asisto={asisto}
        fechaEntrega={fechaEntrega}
        proveedorNombre={
          comproDeProveedor ? proveedorSeleccionado?.nombre : undefined
        }
      />
    );
  }

  const pasoTitulo =
    paso === 1
      ? "¿Qué vas a llevar?"
      : paso === 2
        ? "Fecha y asistencia"
        : paso === 3
          ? "¿Cómo entregas?"
          : "Confirma tu aporte";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link
        href={`/iniciativa/${iniciativa.slug}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a la iniciativa
      </Link>

      <div className="mt-5">
        <p className="text-sm font-medium text-primary">{iniciativa.titulo}</p>
        <h1 className="mt-1.5 font-serif text-3xl font-semibold text-balance text-foreground">
          {pasoTitulo}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:hidden">
          Paso {paso} de 4
          {STEPS.find((s) => s.n === paso)
            ? ` · ${STEPS.find((s) => s.n === paso)!.label}`
            : ""}
        </p>
      </div>

      {/* Stepper burbujas — 100% ancho; mobile solo número */}
      <ol className="mt-6 grid w-full grid-cols-4 gap-0">
        {STEPS.map((s, i) => {
          const skipped = !tienePaso3 && s.n === 3;
          const state =
            skipped
              ? "todo"
              : s.n < paso
                ? "done"
                : s.n === paso
                  ? "current"
                  : "todo";
          const isFirst = i === 0;
          const isLast = i === STEPS.length - 1;
          return (
            <li key={s.n} className="relative flex flex-col items-center">
              {/* Conector izquierdo */}
              {!isFirst ? (
                <span
                  className={cn(
                    "absolute top-4 right-1/2 left-0 h-px -translate-y-1/2",
                    !skipped && STEPS[i - 1]!.n < paso
                      ? "bg-primary/40"
                      : "bg-border",
                  )}
                  aria-hidden
                />
              ) : null}
              {/* Conector derecho */}
              {!isLast ? (
                <span
                  className={cn(
                    "absolute top-4 left-1/2 right-0 h-px -translate-y-1/2",
                    !skipped && s.n < paso ? "bg-primary/40" : "bg-border",
                  )}
                  aria-hidden
                />
              ) : null}
              <button
                type="button"
                disabled={skipped || s.n > paso}
                onClick={() => {
                  if (s.n < paso && !skipped) syncUrl(s.n);
                }}
                className={cn(
                  "relative z-10 flex flex-col items-center gap-1.5 disabled:cursor-default",
                  skipped && "opacity-40",
                )}
                aria-current={state === "current" ? "step" : undefined}
                aria-label={`Paso ${s.n}: ${s.label}`}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    state === "done" && "bg-primary text-primary-foreground",
                    state === "current" &&
                      "bg-primary/15 text-primary ring-2 ring-primary/40",
                    state === "todo" && "bg-muted text-muted-foreground",
                  )}
                >
                  {state === "done" ? <Check className="size-4" /> : s.n}
                </span>
                <span
                  className={cn(
                    "hidden text-center text-xs sm:block",
                    state === "current"
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {paso === 1 ? (
        <div className="mt-7 flex flex-col gap-3">
          <p className="text-base leading-relaxed text-muted-foreground">
            Elige los insumos y la cantidad que te comprometes a llevar. Todo
            suma.
          </p>
          {iniciativa.items.map((item) => {
            const cantidad = cantidades[item.id] ?? 0;
            const activo = cantidad > 0;
            const nuevoTotal = Math.min(item.meta, item.aportado + cantidad);
            const pctActual = progresoItem(item);
            const pctNuevo = Math.min(
              100,
              Math.round((nuevoTotal / item.meta) * 100),
            );

            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-2xl border bg-card p-4 transition-colors",
                  activo
                    ? "border-primary/50 ring-1 ring-primary/20"
                    : "border-border",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{item.nombre}</p>
                    {item.descripcion ? (
                      <p className="text-sm text-muted-foreground">
                        {item.descripcion}
                      </p>
                    ) : null}
                    <p className="text-sm text-muted-foreground">
                      Faltan {Math.max(0, item.meta - item.aportado)}{" "}
                      {item.unidad} para la meta
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCantidad(item.id, cantidad - 1)}
                      disabled={cantidad === 0}
                      aria-label={`Quitar una unidad de ${item.nombre}`}
                      className="flex size-9 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-10 text-center text-lg font-semibold tabular-nums text-foreground">
                      {cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCantidad(item.id, cantidad + 1)}
                      aria-label={`Agregar una unidad de ${item.nombre}`}
                      className="flex size-9 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="flex h-full">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${pctActual}%` }}
                    />
                    {activo && (
                      <div
                        className="h-full bg-accent transition-all"
                        style={{ width: `${pctNuevo - pctActual}%` }}
                      />
                    )}
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground tabular-nums">
                    {item.aportado} / {item.meta} {item.unidad}
                  </span>
                  {activo && (
                    <span className="inline-flex items-center gap-1 font-medium text-accent">
                      <TrendingUp className="size-3" />
                      Subiría a {nuevoTotal} ({pctNuevo}%)
                    </span>
                  )}
                </div>
                {activo && item.valorUnitarioAprox != null && (
                  <p className="mt-1 text-right text-xs text-muted-foreground">
                    Aprox.{" "}
                    <span className="font-medium text-foreground">
                      {formatCOP(cantidad * item.valorUnitarioAprox)}
                    </span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {paso === 2 ? (
        <div className="mt-7 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <label
              htmlFor="fecha-entrega"
              className="text-sm font-medium text-foreground"
            >
              ¿Cuándo la vas a llevar, enviar o comprar?
            </label>
            <p className="mt-1 text-sm text-muted-foreground">
              Opcional. Nos ayuda a organizar la recepción.
            </p>
            <input
              id="fecha-entrega"
              type="date"
              value={fechaEntrega}
              onChange={(e) => setFechaEntrega(e.target.value)}
              min={minFechaEntrega}
              max={maxFechaEntrega}
              className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <button
            type="button"
            onClick={() => setAsisto((v) => !v)}
            aria-pressed={asisto}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
              asisto ? "border-accent/50 bg-accent/8" : "border-border bg-card",
            )}
          >
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-md border",
                asisto
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-background",
              )}
            >
              {asisto && <Check className="size-4" />}
            </span>
            <span>
              <span className="block font-medium text-foreground">
                Voy a asistir al convite
              </span>
              <span className="block text-sm text-muted-foreground">
                {iniciativa.fechaConvite} · {iniciativa.lugarConvite}
              </span>
            </span>
          </button>
        </div>
      ) : null}

      {paso === 3 && tienePaso3 ? (
        <div className="mt-7 space-y-4">
          <p className="text-base leading-relaxed text-muted-foreground">
            Indica si llevas tú los insumos o si te conectas con un proveedor del
            convite.
          </p>

          {tienePuntos ? (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm font-medium text-foreground">
                ¿Dónde entregarás?{" "}
                <span className="font-normal text-muted-foreground">
                  (opcional)
                </span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                El convite es en {iniciativa.zona}. Si dejas el aporte en un
                punto de otra ciudad, elige cuál:
              </p>
              <div className="mt-3 space-y-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border px-3 py-2.5 has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="punto-acopio"
                    className="mt-1 accent-primary"
                    checked={puntoAcopioId === ""}
                    onChange={() => setPuntoAcopioId("")}
                  />
                  <span className="text-sm text-foreground">
                    En el lugar del convite / por acordar / llevo yo los
                    insumos
                  </span>
                </label>
                {iniciativa.puntosAcopio!.map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-border px-3 py-2.5 has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5"
                  >
                    <input
                      type="radio"
                      name="punto-acopio"
                      className="mt-1 accent-primary"
                      checked={puntoAcopioId === p.id}
                      onChange={() => setPuntoAcopioId(p.id)}
                    />
                    <span className="text-sm">
                      <span className="font-medium text-foreground">
                        {p.nombre}
                      </span>
                      <span className="mt-0.5 block text-muted-foreground">
                        {p.ciudad} · {p.direccion}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
              Llevas tú los insumos al lugar del convite o lo acuerdas con el
              organizador.
            </div>
          )}

          {tieneProveedores ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setComproDeProveedor((v) => {
                    const next = !v;
                    if (!next) setProveedorId("");
                    return next;
                  });
                }}
                aria-pressed={comproDeProveedor}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
                  comproDeProveedor
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-card",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-md border",
                    comproDeProveedor
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background",
                  )}
                >
                  {comproDeProveedor && <Check className="size-4" />}
                </span>
                <span>
                  <span className="block font-medium text-foreground">
                    Voy a apoyar comprando a un proveedor
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    Elige el proveedor y te enviamos las instrucciones de pago.
                  </span>
                </span>
              </button>

              {comproDeProveedor ? (
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-sm font-medium text-foreground">
                    ¿A cuál proveedor le vas a comprar?
                  </p>
                  <div className="mt-3 space-y-2">
                    {iniciativa.proveedores!.map((p) => (
                      <label
                        key={p.id}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border border-border px-3 py-2.5 has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5"
                      >
                        <input
                          type="radio"
                          name="proveedor"
                          className="mt-1 accent-primary"
                          checked={proveedorId === p.id}
                          onChange={() => setProveedorId(p.id)}
                        />
                        <span className="text-sm">
                          <span className="font-medium text-foreground">
                            {p.nombre}
                          </span>
                          {p.ciudad || p.direccion ? (
                            <span className="mt-0.5 block text-muted-foreground">
                              {[p.ciudad, p.direccion]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    ))}
                  </div>
                  {proveedorSeleccionado ? (
                    <div className="mt-3 rounded-xl border border-border bg-sidebar/60 px-4 py-3 text-sm">
                      <p className="font-medium text-foreground">
                        Instrucciones de pago
                      </p>
                      <p className="mt-1 whitespace-pre-line text-muted-foreground">
                        {proveedorSeleccionado.instruccionesPago}
                      </p>
                      <p className="mt-2 text-muted-foreground">
                        Te vamos a enviar las instrucciones también por correo.
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      {paso === 4 ? (
        <div className="mt-7 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">
              Resumen de tu compromiso
            </h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {seleccionados.map(({ item, cantidad }) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-foreground">{item.nombre}</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {cantidad} {item.unidad}
                  </span>
                </li>
              ))}
              {asisto ? (
                <li className="flex items-center gap-2 text-foreground">
                  <Check className="size-4 text-accent" />
                  Asistencia · {iniciativa.fechaConvite}
                </li>
              ) : null}
              {fechaEntrega ? (
                <li className="text-muted-foreground">
                  Entrega / compra: {formatFechaEntrega(fechaEntrega)}
                </li>
              ) : null}
              {comproDeProveedor && proveedorSeleccionado ? (
                <li className="text-muted-foreground">
                  Compras a: {proveedorSeleccionado.nombre}
                </li>
              ) : seleccionados.length > 0 ? (
                <li className="text-muted-foreground">
                  Llevas tú los insumos
                  {puntoAcopioId
                    ? ` · punto: ${
                        iniciativa.puntosAcopio?.find(
                          (p) => p.id === puntoAcopioId,
                        )?.nombre ?? ""
                      }`
                    : ""}
                </li>
              ) : null}
              {seleccionados.length === 0 && !asisto ? (
                <li className="text-muted-foreground">
                  Aún no hay selección. Vuelve a los pasos anteriores.
                </li>
              ) : null}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => setAnonimo((v) => !v)}
            aria-pressed={anonimo}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
              anonimo
                ? "border-primary/40 bg-primary/5"
                : "border-border bg-card",
            )}
          >
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-md border",
                anonimo
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background",
              )}
            >
              {anonimo && <Check className="size-4" />}
            </span>
            <span>
              <span className="block font-medium text-foreground">
                Hacer este aporte de forma anónima
              </span>
              <span className="block text-sm text-muted-foreground">
                Tu nombre no aparecerá en el listado de aportantes del
                organizador.
              </span>
            </span>
          </button>

          {!loading && !user ? (
            <p className="rounded-xl border border-border bg-sidebar/60 px-4 py-3 text-sm text-muted-foreground">
              Para confirmar necesitas{" "}
              <Link
                href={`/ingresar?next=${encodeURIComponent(aportePath(4))}`}
                className="font-medium text-primary underline"
                onClick={() => {
                  saveAporteDraft(iniciativa.slug, {
                    cantidades,
                    asisto,
                    anonimo,
                    puntoAcopioId,
                    comproDeProveedor,
                    proveedorId,
                    fechaEntrega,
                    paso: 4,
                    openCompromiso: false,
                  });
                  rememberAuthNext(aportePath(4));
                }}
              >
                iniciar sesión
              </Link>{" "}
              o{" "}
              <Link
                href={`/registrarse?next=${encodeURIComponent(aportePath(4))}`}
                className="font-medium text-primary underline"
                onClick={() => {
                  saveAporteDraft(iniciativa.slug, {
                    cantidades,
                    asisto,
                    anonimo,
                    puntoAcopioId,
                    comproDeProveedor,
                    proveedorId,
                    fechaEntrega,
                    paso: 4,
                    openCompromiso: false,
                  });
                  rememberAuthNext(aportePath(4));
                }}
              >
                crear una cuenta
              </Link>
              . Al terminar vuelves a este paso.
            </p>
          ) : null}
        </div>
      ) : null}

      {stepError || error ? (
        <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {stepError || error}
        </p>
      ) : null}

      <div className="sticky bottom-0 mt-6 -mx-4 border-t border-border bg-background/95 px-4 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          {paso > 1 ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 shrink-0"
              onClick={onAtras}
            >
              Atrás
            </Button>
          ) : (
            <span />
          )}

          {paso < 4 ? (
            <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
              <p className="hidden text-sm text-muted-foreground sm:block">
                {totalItems > 0 ? (
                  <>
                    {totalItems} {totalItems === 1 ? "ítem" : "ítems"}
                    {asisto ? " + asistencia" : ""}
                  </>
                ) : asisto ? (
                  "Asistencia"
                ) : (
                  "Sin selección aún"
                )}
              </p>
              <Button
                size="lg"
                className="h-11 shrink-0 px-6 text-base"
                disabled={!puedeAvanzarDesde(paso)}
                onClick={onContinuar}
              >
                Continuar
              </Button>
            </div>
          ) : (
            <Button
              size="lg"
              className="h-11 shrink-0 px-6 text-base"
              disabled={!puedeConfirmar || submitting}
              onClick={pedirConfirmacion}
            >
              Confirmar aporte
            </Button>
          )}
        </div>
      </div>

      {mostrarCompromiso ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="compromiso-titulo"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-lg">
            <h2
              id="compromiso-titulo"
              className="font-serif text-xl font-semibold text-foreground"
            >
              Este aporte es un compromiso serio
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Al confirmar, otras personas y el organizador van a contar con lo
              que ofreces. Si no puedes cumplirlo, cancela o ajusta el aporte
              antes del convite. No registres cantidades que no vas a llevar.
            </p>
            {(seleccionados.length > 0 || asisto) && (
              <ul className="mt-4 rounded-xl border border-border bg-card px-4 py-3 text-sm">
                {seleccionados.map(({ item, cantidad }) => (
                  <li
                    key={item.id}
                    className="flex justify-between gap-3 py-1 text-foreground"
                  >
                    <span>{item.nombre}</span>
                    <span className="font-semibold tabular-nums">
                      {cantidad} {item.unidad}
                    </span>
                  </li>
                ))}
                {asisto ? (
                  <li className="py-1 text-foreground">
                    Asistencia al convite
                  </li>
                ) : null}
                {fechaEntrega ? (
                  <li className="py-1 text-foreground">
                    Entrega: {formatFechaEntrega(fechaEntrega)}
                  </li>
                ) : null}
                {comproDeProveedor && proveedorSeleccionado ? (
                  <li className="py-1 text-foreground">
                    Vas a comprar a: {proveedorSeleccionado.nombre}
                  </li>
                ) : null}
              </ul>
            )}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                disabled={submitting}
                onClick={() => setMostrarCompromiso(false)}
              >
                Revisar de nuevo
              </Button>
              <Button disabled={submitting} onClick={() => void confirmar()}>
                {submitting ? "Guardando…" : "Sí, me comprometo"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Confirmacion({
  iniciativa,
  seleccionados,
  asisto,
  fechaEntrega,
  proveedorNombre,
}: {
  iniciativa: Iniciativa;
  seleccionados: { item: Iniciativa["items"][number]; cantidad: number }[];
  asisto: boolean;
  fechaEntrega: string;
  proveedorNombre?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-14 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent/12 text-accent">
        <CheckCircle2 className="size-8" />
      </div>
      <h1 className="mt-6 font-serif text-3xl font-semibold text-balance text-foreground">
        ¡Gracias por sumarte!
      </h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        Registramos tu compromiso con{" "}
        <span className="font-medium text-foreground">{iniciativa.titulo}</span>.
        Los contadores de la iniciativa ya reflejan tu aporte.
      </p>

      <div className="mt-7 rounded-2xl border border-border bg-card p-5 text-left">
        <h2 className="text-sm font-semibold text-foreground">Tu compromiso</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {seleccionados.map(({ item, cantidad }) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="text-foreground">{item.nombre}</span>
              <span className="font-semibold tabular-nums text-foreground">
                {cantidad} {item.unidad}
              </span>
            </li>
          ))}
          {asisto && (
            <li className="flex items-center gap-2 text-sm text-foreground">
              <Check className="size-4 text-accent" />
              Asistencia confirmada · {iniciativa.fechaConvite}
            </li>
          )}
          {fechaEntrega && (
            <li className="flex items-center gap-2 text-sm text-foreground">
              <Check className="size-4 text-accent" />
              Entrega: {formatFechaEntrega(fechaEntrega)}
            </li>
          )}
          {proveedorNombre && (
            <li className="flex items-center gap-2 text-sm text-foreground">
              <Check className="size-4 text-accent" />
              Vas a comprar a: {proveedorNombre}
            </li>
          )}
        </ul>
      </div>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button
          size="lg"
          className="h-11 px-6"
          render={<Link href="/panel/aportante" />}
        >
          Ver mis compromisos
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-11 px-6"
          render={<Link href={`/iniciativa/${iniciativa.slug}`} />}
        >
          Volver a la iniciativa
        </Button>
      </div>
    </div>
  );
}
