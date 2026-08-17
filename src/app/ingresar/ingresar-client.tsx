"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/layout/brand-mark";
import { useAuth } from "@/components/auth/auth-provider";
import { ApiError } from "@/lib/api";
import { HandHeart, HeartHandshake } from "lucide-react";

export function IngresarClient() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/panel/aportante";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.push(next);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "Credenciales incorrectas."
          : "No pudimos iniciar sesión.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/">
            <BrandMark className="mb-8" />
          </Link>
          <h1 className="text-balance font-serif text-3xl text-foreground">
            Bienvenido de vuelta
          </h1>
          <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
            Ingresa para aportar a un convite o hacer seguimiento a los tuyos.
          </p>

          <form className="mt-8 space-y-5" onSubmit={(e) => void onSubmit(e)}>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Ingresando…" : "Ingresar"}
            </Button>
          </form>

          {process.env.NODE_ENV !== "production" ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Demo: <code>member@convites.test</code> / <code>password</code>
            </p>
          ) : null}

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            <span>o entra según lo que buscas</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid gap-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              render={<Link href="/panel/aportante" />}
            >
              <HandHeart className="h-4 w-4 text-primary" />
              Quiero aportar a un convite
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              render={<Link href="/panel/creador" />}
            >
              <HeartHandshake className="h-4 w-4 text-primary" />
              Quiero abrir un convite
            </Button>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            ¿Aún no tienes cuenta?{" "}
            <Link
              href="/registrarse"
              className="font-medium text-primary transition-colors hover:text-primary/80"
            >
              Regístrate
            </Link>
          </p>
        </div>
      </div>

      <div className="relative hidden lg:block">
        <Image
          src="/images/hero-convite.png"
          alt="Vecinos trabajando juntos en un convite comunitario"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-10">
          <p className="max-w-md text-balance font-serif text-2xl leading-snug text-background">
            &ldquo;Aquí nadie manda plata. Aquí se manda una mano, una teja, un
            día de trabajo.&rdquo;
          </p>
          <p className="mt-3 text-sm text-background/80">
            Doña Rosa, lideresa comunitaria en Santa Rosa de Cabal
          </p>
        </div>
      </div>
    </div>
  );
}
