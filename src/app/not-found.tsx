import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="font-serif text-2xl text-foreground">No encontramos esta página</h1>
      <p className="text-sm text-muted-foreground">
        El enlace puede estar roto o el convite ya no está disponible.
      </p>
      <Button render={<Link href="/explorar" />}>Explorar convites</Button>
    </div>
  );
}
