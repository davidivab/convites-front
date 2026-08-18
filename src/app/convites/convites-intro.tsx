"use client";

import { PageIntroSection } from "@/components/layout/page-intro-section";
import { TrustBanner } from "@/components/layout/trust-banner";

export function ConvitesIntro() {
  return (
    <PageIntroSection
      title="Convites abiertos en Risaralda"
      className="bg-secondary/40"
      description="Encontrá una iniciativa cerca tuyo y sumate con lo que puedas llevar. O buscá por material: si tenés algo, mirá a quién le sirve."
    >
      <TrustBanner className="bg-card" />
    </PageIntroSection>
  );
}
