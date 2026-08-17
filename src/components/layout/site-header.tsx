"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/layout/brand-mark";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string };
type NavGroup = { label: string; items: NavLink[] };
type NavItem = NavLink | NavGroup;

const isGroup = (item: NavItem): item is NavGroup => "items" in item;

const NAV: NavItem[] = [
  { href: "/explorar", label: "Explorar" },
  {
    label: "Adicionales",
    items: [
      { href: "/centros", label: "Centros de interés" },
      { href: "/manos-profesionales", label: "Manos profesionales" },
    ],
  },
  { href: "/crear", label: "Crear iniciativa" },
  { href: "/quienes-somos", label: "Quiénes somos" },
];

function DesktopDropdown({
  group,
  pathname,
}: {
  group: NavGroup;
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = group.items.some((i) => i.href === pathname);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          active && "text-foreground",
        )}
      >
        {group.label}
        <ChevronDown
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div role="menu" className="absolute left-0 top-full z-50 min-w-56 pt-2">
          <div className="overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-lg">
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  pathname === item.href && "bg-muted text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user, loading, logout, hasPermission } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="rounded-lg focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Wordmark />
          <span className="sr-only">Convites — inicio</span>
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Navegación principal"
        >
          {NAV.map((item) =>
            isGroup(item) ? (
              <DesktopDropdown
                key={item.label}
                group={item}
                pathname={pathname}
              />
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  pathname === item.href && "text-foreground",
                )}
              >
                {item.label}
              </Link>
            ),
          )}
          {hasPermission("iniciativas.moderate") ? (
            <Link
              href="/moderacion"
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                pathname === "/moderacion" && "text-foreground",
              )}
            >
              Moderación
            </Link>
          ) : null}
          {hasPermission("users.manage") ? (
            <Link
              href="/admin"
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                pathname === "/admin" && "text-foreground",
              )}
            >
              Admin
            </Link>
          ) : null}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {loading ? null : user ? (
            <>
              <Button
                variant="ghost"
                size="lg"
                render={<Link href="/panel/aportante" />}
              >
                {user.name.split(" ")[0]}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => void logout()}
              >
                Salir
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="lg"
                render={<Link href="/ingresar" />}
              >
                Iniciar sesión
              </Button>
              <Button size="lg" render={<Link href="/registrarse" />}>
                Crear cuenta
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-10 items-center justify-center rounded-lg text-foreground md:hidden"
          aria-expanded={open}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/70 bg-background md:hidden">
          <nav
            className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-3"
            aria-label="Navegación móvil"
          >
            {NAV.map((item) =>
              isGroup(item) ? (
                <div key={item.label} className="py-1">
                  <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                  {item.items.map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-2.5 text-base font-medium text-foreground hover:bg-muted"
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-base font-medium text-foreground hover:bg-muted"
                >
                  {item.label}
                </Link>
              ),
            )}
            <div className="mt-2 flex flex-col gap-2">
              {user ? (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    render={
                      <Link
                        href="/panel/aportante"
                        onClick={() => setOpen(false)}
                      />
                    }
                  >
                    Mi panel
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => {
                      setOpen(false);
                      void logout();
                    }}
                  >
                    Salir
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    render={
                      <Link href="/ingresar" onClick={() => setOpen(false)} />
                    }
                  >
                    Iniciar sesión
                  </Button>
                  <Button
                    size="lg"
                    render={
                      <Link
                        href="/registrarse"
                        onClick={() => setOpen(false)}
                      />
                    }
                  >
                    Crear cuenta
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
