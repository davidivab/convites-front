"use client";

import { PageIntroSection } from "@/components/layout/page-intro-section";
import { TrustBanner } from "@/components/layout/trust-banner";

export function ConvitesIntro() {
  return (
    <PageIntroSection
      title="Convites abiertos en Risaralda"
      className="bg-secondary/40"
      description="Encuentra una iniciativa cerca de ti y súmate con lo que puedas llevar. O busca por material: si tienes algo, mira a quién le sirve."
    >
      <TrustBanner className="bg-card" />
    </PageIntroSection>
  );
}
