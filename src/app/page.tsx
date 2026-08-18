import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/layout/brand-mark";
import { TrustBanner } from "@/components/layout/trust-banner";
import { ComoFunciona } from "@/components/marketing/como-funciona";
import { CampaignCard } from "@/components/iniciativa/campaign-card";
import { fetchIniciativas } from "@/lib/convites-api";
import type { Iniciativa } from "@/lib/data";

export const revalidate = 60;

export default async function HomePage() {
  let destacadas: Iniciativa[] = [];
  try {
    destacadas = await fetchIniciativas({
      destacadas: true,
      server: true,
      revalidate: 60,
    });
    if (destacadas.length === 0) {
      destacadas = (
        await fetchIniciativas({ server: true, revalidate: 60 })
      ).slice(0, 3);
    }
  } catch {
    destacadas = [];
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <Image
              src="/images/hero-convite.png"
              alt="Vecinos de Risaralda reunidos en un convite comunitario reconstruyendo una casa juntos"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/45 to-foreground/25" />
          </div>

          <div className="mx-auto flex min-h-[86svh] w-full max-w-6xl flex-col justify-end px-4 pb-14 pt-24">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2.5 text-background">
                <BrandMark className="size-10" />
                <span className="font-serif text-3xl font-semibold tracking-tight">
                  Convites
                </span>
              </div>

              <h1 className="mt-6 font-serif text-4xl leading-[1.05] font-semibold text-balance text-background sm:text-5xl md:text-6xl">
                Colombia se levanta cuando nos juntamos: ya lo hicimos, y lo
                haremos otra vez.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-background/85 md:text-lg">
                Vecinos organizando convites en las zonas afectadas de Risaralda.
                No somos fundación ni empresa.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="h-12 px-6 text-base"
                  render={<Link href="/crear" />}
                >
                  <span>Crear un convite</span>
                  <ArrowRight data-icon="inline-end" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 border-background/30 bg-background/10 px-6 text-base text-background backdrop-blur-sm hover:bg-background/20 hover:text-background"
                  render={<Link href="/convites" />}
                >
                  Ver convites
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pt-8">
          <TrustBanner className="bg-card shadow-sm" />
        </section>

        <ComoFunciona />

        <section className="mx-auto w-full max-w-6xl px-4 py-14">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                <Sparkles className="size-4" />
                Destacadas
              </div>
              <h2 className="font-serif text-3xl font-semibold text-foreground">
                Convites que necesitan manos ahora
              </h2>
            </div>
            <Button variant="outline" render={<Link href="/convites" />}>
              Ver todas
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>

          {destacadas.length === 0 ? (
            <p className="rounded-2xl border border-border bg-card p-8 text-muted-foreground">
              Aún no hay iniciativas publicadas. Sé el primero en{" "}
              <Link href="/crear" className="font-medium text-primary underline">
                crear un convite
              </Link>
              .
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {destacadas.slice(0, 3).map((ini) => (
                <CampaignCard key={ini.id} iniciativa={ini} />
              ))}
            </div>
          )}
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-16">
          <div className="flex flex-col items-start gap-6 rounded-2xl border border-border bg-card px-6 py-10 md:flex-row md:items-center md:justify-between md:px-10">
            <div className="max-w-xl">
              <h2 className="font-serif text-2xl font-semibold text-balance text-foreground md:text-3xl">
                ¿Tu barrio o vereda necesita un convite?
              </h2>
              <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
                Contá qué pasó y qué falta. Lo revisamos y lo hacemos llegar a
                más gente.
              </p>
            </div>
            <Button
              size="lg"
              className="shrink-0"
              render={<Link href="/crear" />}
            >
              Crear un convite
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
