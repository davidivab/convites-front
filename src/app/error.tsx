"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="font-serif text-2xl text-foreground">Algo salió mal</h1>
      <p className="text-sm text-muted-foreground">
        No pudimos cargar esta página. Puedes intentar de nuevo o volver al inicio.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={reset}>
          Reintentar
        </Button>
        <Button variant="outline" render={<Link href="/" />}>
          Ir al inicio
        </Button>
      </div>
    </div>
  );
}
