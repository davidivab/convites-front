import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { TrustBanner } from "@/components/layout/trust-banner";
import { ExplorarClient } from "./explorar-client";
import { fetchIniciativas } from "@/lib/convites-api";
import type { Iniciativa } from "@/lib/data";

export const metadata = {
  title: "Explorar convites — Convites",
  description:
    "Iniciativas comunitarias abiertas en las zonas afectadas de Risaralda.",
};

export default async function ExplorarPage() {
  let iniciativas: Iniciativa[] = [];
  try {
    iniciativas = await fetchIniciativas({ server: true });
  } catch {
    iniciativas = [];
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border bg-sidebar/60">
          <div className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
            <h1 className="font-serif text-3xl font-semibold text-balance text-foreground md:text-4xl">
              Convites abiertos en Risaralda
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Encontrá una iniciativa cerca tuyo y sumate con lo que puedas
              llevar. Cada aporte se refleja al instante: todo suma.
            </p>
            <TrustBanner className="mt-6 max-w-2xl bg-card" />
          </div>
        </section>

        <ExplorarClient iniciativas={iniciativas} />
      </main>
      <SiteFooter />
    </div>
  );
}
