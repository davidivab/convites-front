import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AportarClient } from "./aportar-client";
import { fetchIniciativa } from "@/lib/convites-api";

export default async function AportarPage({
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

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <AportarClient iniciativa={ini} />
      </main>
      <SiteFooter />
    </div>
  );
}
