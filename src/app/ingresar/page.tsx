import type { Metadata } from "next";
import { Suspense } from "react";
import { IngresarClient } from "./ingresar-client";

export const metadata: Metadata = {
  title: "Iniciar sesión — Convites",
};

export default function IngresarPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-muted-foreground">Cargando…</div>}>
      <IngresarClient />
    </Suspense>
  );
}
