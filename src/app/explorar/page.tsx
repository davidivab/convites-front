import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ExplorarClient } from "./explorar-client";
import { ExplorarIntro } from "./explorar-intro";
import { fetchIniciativas, fetchMateriales } from "@/lib/convites-api";
import type { Iniciativa } from "@/lib/data";
import type { ApiMaterial } from "@/lib/types";

export const metadata = {
  title: "Explorar convites — Convites",
  description:
    "Iniciativas comunitarias abiertas en las zonas afectadas de Risaralda.",
};

export default async function ExplorarPage() {
  let iniciativas: Iniciativa[] = [];
  let materiales: ApiMaterial[] = [];
  try {
    const [inis, mats] = await Promise.all([
      fetchIniciativas({ server: true }),
      fetchMateriales({ server: true, per_page: 50 }),
    ]);
    iniciativas = inis;
    materiales = mats;
  } catch {
    iniciativas = [];
    materiales = [];
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <ExplorarIntro />

        <ExplorarClient
          iniciativas={iniciativas}
          materiales={materiales}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
