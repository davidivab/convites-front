"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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

export function AportarClient({ iniciativa }: { iniciativa: Iniciativa }) {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [asisto, setAsisto] = useState(true);
  const [anonimo, setAnonimo] = useState(false);
  const [puntoAcopioId, setPuntoAcopioId] = useState<string>("");
  const [confirmado, setConfirmado] = useState(false);
  const [mostrarCompromiso, setMostrarCompromiso] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const puedeConfirmar = totalItems > 0 || asisto;

  function pedirConfirmacion() {
    if (!token) {
      router.push(
        `/ingresar?next=${encodeURIComponent(`/iniciativa/${iniciativa.slug}/aportar`)}`,
      );
      return;
    }
    setError(null);
    setMostrarCompromiso(true);
  }

  async function confirmar() {
    if (!token) {
      router.push(
        `/ingresar?next=${encodeURIComponent(`/iniciativa/${iniciativa.slug}/aportar`)}`,
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await crearAporte(token, iniciativa.id, {
        asiste_al_convite: asisto,
        anonimo,
        ...(puntoAcopioId
          ? { punto_acopio_id: Number(puntoAcopioId) }
          : {}),
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
      />
    );
  }

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
          ¿Qué vas a llevar al convite?
        </h1>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          Elige los insumos y la cantidad que te comprometes a llevar. Todo
          suma: tus aportes se van a reflejar en los contadores de la
          iniciativa.
        </p>
        {!loading && !user ? (
          <p className="mt-3 rounded-xl border border-border bg-sidebar/60 px-4 py-3 text-sm text-muted-foreground">
            Vas a necesitar{" "}
            <Link
              href={`/ingresar?next=${encodeURIComponent(`/iniciativa/${iniciativa.slug}/aportar`)}`}
              className="font-medium text-primary underline"
            >
              iniciar sesión
            </Link>{" "}
            para confirmar el aporte.
          </p>
        ) : null}
      </div>

      <div className="mt-7 flex flex-col gap-3">
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
                  <p className="text-sm text-muted-foreground">
                    Faltan {Math.max(0, item.meta - item.aportado)} {item.unidad}{" "}
                    para la meta
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
            </div>
          );
        })}
      </div>

      {(iniciativa.puntosAcopio?.length ?? 0) > 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground">
            ¿Dónde entregarás?{" "}
            <span className="font-normal text-muted-foreground">(opcional)</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            El convite es en {iniciativa.zona}. Si dejas el aporte en un punto
            de otra ciudad, elige cuál:
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
                En el lugar del convite / por acordar
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
                  <span className="font-medium text-foreground">{p.nombre}</span>
                  <span className="mt-0.5 block text-muted-foreground">
                    {p.ciudad} · {p.direccion}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setAsisto((v) => !v)}
        aria-pressed={asisto}
        className={cn(
          "mt-4 flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
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

      <button
        type="button"
        onClick={() => setAnonimo((v) => !v)}
        aria-pressed={anonimo}
        className={cn(
          "mt-3 flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
          anonimo ? "border-primary/40 bg-primary/5" : "border-border bg-card",
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
            Tu nombre no aparecerá en el listado de aportantes del organizador.
          </span>
        </span>
      </button>

      {error ? (
        <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="sticky bottom-0 mt-6 -mx-4 border-t border-border bg-background/95 px-4 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {totalItems > 0 ? (
              <>
                Vas a llevar{" "}
                <span className="font-semibold text-foreground">
                  {totalItems}
                </span>{" "}
                {totalItems === 1 ? "ítem" : "ítems"}
                {asisto && " + tu asistencia"}
              </>
            ) : asisto ? (
              "Solo confirmas tu asistencia"
            ) : (
              "Elige al menos un aporte o tu asistencia"
            )}
          </p>
          <Button
            size="lg"
            className="h-11 shrink-0 px-6 text-base"
            disabled={!puedeConfirmar || submitting}
            onClick={pedirConfirmacion}
          >
            Confirmar aporte
          </Button>
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
              que ofrecés. Si no podés cumplirlo, cancelá o ajustá el aporte
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
              <Button
                disabled={submitting}
                onClick={() => void confirmar()}
              >
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
}: {
  iniciativa: Iniciativa;
  seleccionados: { item: Iniciativa["items"][number]; cantidad: number }[];
  asisto: boolean;
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
