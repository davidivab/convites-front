import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  HandHeart,
  MapPin,
  Users,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge, UrgencyBadge } from "@/components/iniciativa/status-badges";
import { ItemProgressRow } from "@/components/iniciativa/item-progress-row";
import { ExternalMoneyCallout } from "@/components/iniciativa/external-money-callout";
import { IniciativaMapSection } from "@/components/iniciativa/iniciativa-map-section";
import { CATEGORIAS, progresoTotal } from "@/lib/data";
import { fetchIniciativa } from "@/lib/convites-api";

export default async function IniciativaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let ini;
  try {
    ini = await fetchIniciativa(slug, { server: true });
  } catch {
    notFound();
  }

  const pct = ini.progreso ?? progresoTotal(ini.items);
  const lugar = ini.lugarExacto || ini.lugarConvite;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 pt-6">
          <Link
            href="/convites"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Volver a explorar
          </Link>
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 py-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              {CATEGORIAS[ini.categoria] ?? ini.categoria}
            </span>
            <StatusBadge estado={ini.estado} />
            <UrgencyBadge urgencia={ini.urgencia} />
          </div>
          <h1 className="mt-4 max-w-3xl font-serif text-3xl leading-tight font-semibold text-balance text-foreground md:text-4xl">
            {ini.titulo}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" />
              {ini.zona}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {ini.fechaConvite}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="size-4" />
              {ini.asistentes} personas se sumaron
            </span>
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1.7fr_1fr]">
            <div>
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
                <Image
                  src={ini.imagen || "/images/campaign-casa.png"}
                  alt={ini.titulo}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 700px"
                  className="object-cover"
                />
              </div>

              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
                <Avatar className="size-11">
                  <AvatarFallback className="bg-primary/12 font-semibold text-primary">
                    {ini.creadorInicial}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Organiza este convite
                  </p>
                  <p className="font-medium text-foreground">{ini.creador}</p>
                </div>
              </div>

              <section className="mt-8">
                <h2 className="font-serif text-2xl font-semibold text-foreground">
                  La historia
                </h2>
                <div className="mt-3 flex flex-col gap-4 text-base leading-relaxed text-muted-foreground">
                  {ini.historia.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </section>

              {(ini.galeria?.length ?? 0) > 0 ? (
                <section className="mt-8">
                  <h2 className="font-serif text-2xl font-semibold text-foreground">
                    Galería
                  </h2>
                  <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {ini.galeria!.map((g) => (
                      <li
                        key={g.id}
                        className="relative aspect-square overflow-hidden rounded-xl bg-muted"
                      >
                        <Image
                          src={g.url}
                          alt=""
                          fill
                          sizes="(max-width: 768px) 50vw, 220px"
                          className="object-cover"
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {(ini.enlaces?.length ?? 0) > 0 ? (
                <section className="mt-8">
                  <h2 className="font-serif text-2xl font-semibold text-foreground">
                    Enlaces
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {ini.enlaces!.map((e) => (
                      <li key={e.id}>
                        <a
                          href={e.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                        >
                          {e.titulo}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="mt-8 grid gap-3 rounded-2xl border border-border bg-sidebar/60 p-5 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-card text-primary">
                    <CalendarDays className="size-4.5" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Día del convite
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {ini.fechaConvite}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-card text-primary">
                    <MapPin className="size-4.5" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Lugar de encuentro
                    </p>
                    <p className="text-sm font-medium text-foreground">{lugar}</p>
                    {ini.lugarExacto ? (
                      <p className="mt-1 text-xs text-accent">
                        Dirección exacta visible porque ya confirmaste aporte.
                      </p>
                    ) : null}
                  </div>
                </div>
              </section>

              {(ini.puntosAcopio?.length ?? 0) > 0 ? (
                <section className="mt-8">
                  <h2 className="font-serif text-2xl font-semibold text-foreground">
                    Puntos de acopio
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    El convite es en {ini.zona}. También puedes dejar aportes en
                    estos puntos de otras ciudades:
                  </p>
                  <ul className="mt-4 space-y-3">
                    {ini.puntosAcopio!.map((p) => (
                      <li
                        key={p.id}
                        className="rounded-xl border border-border bg-card p-4"
                      >
                        <p className="font-medium text-foreground">{p.nombre}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {p.ciudad}
                        </p>
                        <p className="mt-1 flex items-start gap-1.5 text-sm text-foreground">
                          <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
                          {p.direccion}
                        </p>
                        {p.horario ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Horario: {p.horario}
                          </p>
                        ) : null}
                        {p.contacto ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Contacto: {p.contacto}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {typeof ini.lat === "number" && typeof ini.lng === "number" ? (
                <IniciativaMapSection
                  lat={ini.lat}
                  lng={ini.lng}
                  titulo={ini.titulo}
                />
              ) : null}
            </div>

            <aside className="lg:sticky lg:top-20 lg:h-fit">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-serif text-xl font-semibold text-foreground">
                    Lo que falta
                  </h2>
                  <span className="text-sm font-semibold tabular-nums text-primary">
                    {pct}% listo
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <HandHeart className="size-4 text-accent" />
                  Todo suma. Cada aporte cuenta.
                </p>

                <div className="mt-3 divide-y divide-border">
                  {ini.items.map((item) => (
                    <ItemProgressRow key={item.id} item={item} />
                  ))}
                </div>

                <div className="mt-5 flex flex-col gap-2.5">
                  <Button
                    size="lg"
                    className="h-12 w-full text-base"
                    render={<Link href={`/iniciativa/${ini.slug}/aportar`} />}
                  >
                    Voy a llevar
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="h-11 w-full text-base"
                    render={<Link href={`/iniciativa/${ini.slug}/aportar`} />}
                  >
                    Me sumo al convite
                  </Button>
                </div>

                {ini.enlaceExterno && (
                  <div className="mt-4">
                    <ExternalMoneyCallout
                      plataforma={ini.enlaceExterno.plataforma}
                      url={ini.enlaceExterno.url}
                    />
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
