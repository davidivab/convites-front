"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AceptacionesLegales } from "@/components/auth/aceptaciones-legales";
import { GoogleButton } from "@/components/auth/google-button";
import { useAuth } from "@/components/auth/auth-provider";
import { ApiError } from "@/lib/api";
import {
  authNextQuery,
  rememberAuthNext,
  safeNextPath,
} from "@/lib/auth-next";
import { ArrowLeft } from "lucide-react";

const DEMO_ACCOUNTS: {
  email: string;
  rol: string;
  para: string;
  destacado?: boolean;
}[] = [
  {
    email: "admin@convites.test",
    rol: "admin",
    para: "Editar/publicar convites en /admin · cola /admin/moderacion · todo",
    destacado: true,
  },
  {
    email: "moderator@convites.test",
    rol: "moderator",
    para: "Moderar y editar convites (Colombia) en /moderacion",
  },
  {
    email: "voluntario@convites.test",
    rol: "voluntario",
    para: "Cuenta territorial (sin moderar)",
  },
  {
    email: "member@convites.test",
    rol: "member",
    para: "Creador principal · panel /panel/creador (Techos Quibdó, etc.)",
  },
  {
    email: "creador2@convites.test",
    rol: "member",
    para: "Otro creador (borrador + escuela El Manzano)",
  },
  {
    email: "aportante1@convites.test",
    rol: "member + profesional",
    para: "Aportes + perfil profesional demo (Laura Cardona)",
  },
];

const DEMO_PASSWORD = "password";

export function IngresarClient() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    rememberAuthNext(next);
  }, [next]);

  const puedeAutenticar = aceptaTerminos;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!puedeAutenticar || loading) return;
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

  function usarDemo(demoEmail: string) {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setAceptaTerminos(true);
  }

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Volver
          </Link>
          <h1 className="text-balance font-serif text-3xl text-foreground">
            Bienvenido de vuelta
          </h1>
          <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
            Ingresa para aportar a un convite o hacer seguimiento a los tuyos.
          </p>

          <div className="mt-8">
            <AceptacionesLegales
              aceptaTerminos={aceptaTerminos}
              onTerminosChange={setAceptaTerminos}
              mostrarDescargo={false}
            />
          </div>

          <form className="mt-6 space-y-5" onSubmit={(e) => void onSubmit(e)}>
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
            <Button
              className="w-full"
              type="submit"
              disabled={!puedeAutenticar || loading}
            >
              {loading ? "Ingresando…" : "Ingresar"}
            </Button>
            {!puedeAutenticar ? (
              <p className="text-xs text-muted-foreground">
                Marca los términos para poder ingresar.
              </p>
            ) : null}
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            <span>o</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <GoogleButton
            label="Continuar con Google"
            disabled={!puedeAutenticar}
            intent="login"
          />

          {process.env.NODE_ENV !== "production" ? (
            <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 p-3">
              <p className="text-xs font-medium text-foreground">
                Cuentas demo (solo desarrollo)
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Password de todas: <code>{DEMO_PASSWORD}</code>. Usar autocompleta
                el formulario; tú das Ingresar.
              </p>
              <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-border bg-card">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-muted/80 text-muted-foreground">
                    <tr>
                      <th className="px-2 py-1.5 font-medium">Email</th>
                      <th className="px-2 py-1.5 font-medium">Rol</th>
                      <th className="px-2 py-1.5 font-medium">
                        <span className="sr-only">Usar</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_ACCOUNTS.map((cuenta) => (
                      <tr
                        key={cuenta.email}
                        className={
                          "border-t border-border align-top" +
                          (cuenta.destacado ? " bg-primary/5" : "")
                        }
                      >
                        <td className="px-2 py-1.5">
                          <code className="text-[11px]">{cuenta.email}</code>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {cuenta.para}
                          </p>
                        </td>
                        <td className="px-2 py-1.5 text-muted-foreground">
                          {cuenta.rol}
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          <Button
                            type="button"
                            variant={cuenta.destacado ? "default" : "outline"}
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => usarDemo(cuenta.email)}
                          >
                            Usar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            ¿Aún no tienes cuenta?{" "}
            <Link
              href={`/registrarse${authNextQuery(next)}`}
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
