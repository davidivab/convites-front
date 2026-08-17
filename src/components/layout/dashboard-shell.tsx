"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ChevronDown,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Pencil,
  UserRound,
  X,
} from "lucide-react"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import { cn } from "@/lib/utils"

type Tab = { href: string; label: string; active?: boolean }

export function DashboardShell({
  title,
  subtitle,
  tabs,
  children,
}: {
  title: string
  subtitle: string
  tabs: Tab[]
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <PanelMenu />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
          <header className="mb-6 md:mb-8">
            <h1 className="text-balance font-serif text-3xl text-foreground md:text-4xl">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          </header>

          {tabs.length > 0 ? (
            <nav
              className="mb-8 flex gap-1 overflow-x-auto border-b border-border pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Secciones del panel"
            >
              {tabs.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-current={t.active ? "page" : undefined}
                  className={cn(
                    "-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                    t.active
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                </Link>
              ))}
            </nav>
          ) : null}

          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

function PanelMenu() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, hasPermission } = useAuth()
  const [open, setOpen] = useState(false)
  const [dashOpen, setDashOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setOpen(false)
    setDashOpen(false)
  }, [pathname])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false)
        setDashOpen(false)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  async function onLogout() {
    setOpen(false)
    await logout()
    router.push("/")
  }

  const dashItems = [
    { href: "/panel/aportante", label: "Panel aportante" },
    { href: "/panel/creador", label: "Panel organizador" },
    ...(hasPermission("profesional_perfil.view_own")
      ? [{ href: "/panel/profesional", label: "Panel profesional" }]
      : []),
    ...(hasPermission("iniciativas.moderate")
      ? [{ href: "/moderacion", label: "Moderación" }]
      : []),
    ...(hasPermission("users.manage")
      ? [
          { href: "/admin", label: "Administración" },
          { href: "/admin/convites", label: "Auditoría convites" },
        ]
      : []),
  ]

  const links = [
    { href: "/", label: "Inicio", icon: Home },
    { href: "/perfil", label: "Mi perfil", icon: UserRound },
    { href: "/perfil#editar", label: "Editar perfil", icon: Pencil },
  ]

  return (
    <div className="sticky top-16 z-30 border-b border-border/70 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-12 w-full max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex items-center gap-2 md:hidden">
          <span className="text-sm font-medium text-foreground">Mi cuenta</span>
        </div>

        {/* Desktop */}
        <nav
          className="hidden flex-1 items-center gap-1 md:flex"
          aria-label="Menú del panel"
        >
          <Link
            href="/"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
              pathname === "/" ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <Home className="size-4" />
            Inicio
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setDashOpen((v) => !v)}
              aria-expanded={dashOpen}
              aria-haspopup="menu"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
                pathname.startsWith("/panel") || pathname === "/moderacion"
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <LayoutDashboard className="size-4" />
              Dashboard
              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  dashOpen && "rotate-180",
                )}
              />
            </button>
            {dashOpen ? (
              <div
                role="menu"
                className="absolute left-0 top-full z-50 min-w-52 pt-1"
              >
                <div className="overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-lg">
                  {dashItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      onClick={() => setDashOpen(false)}
                      className={cn(
                        "block rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                        pathname === item.href
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <Link
            href="/perfil"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
              pathname === "/perfil"
                ? "text-foreground"
                : "text-muted-foreground",
            )}
          >
            <UserRound className="size-4" />
            Mi perfil
          </Link>
          <Link
            href="/perfil#editar"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Pencil className="size-4" />
            Editar perfil
          </Link>
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {user ? (
            <span className="max-w-[10rem] truncate text-sm text-muted-foreground">
              {user.name}
            </span>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => void onLogout()}
          >
            <LogOut className="size-3.5" />
            Cerrar sesión
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-lg text-foreground md:hidden"
          aria-expanded={open}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open ? (
        <div className="border-t border-border bg-background md:hidden">
          <nav
            className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-3"
            aria-label="Menú del panel móvil"
          >
            {user ? (
              <p className="px-3 pb-2 text-sm text-muted-foreground">
                Sesión de{" "}
                <span className="font-medium text-foreground">{user.name}</span>
              </p>
            ) : null}

            {links.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "inline-flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium hover:bg-muted",
                    pathname === item.href.split("#")[0]
                      ? "bg-muted text-foreground"
                      : "text-foreground",
                  )}
                >
                  <Icon className="size-5 text-primary" />
                  {item.label}
                </Link>
              )
            })}

            <p className="mt-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Dashboard
            </p>
            {dashItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "inline-flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium hover:bg-muted",
                  pathname === item.href
                    ? "bg-muted text-foreground"
                    : "text-foreground",
                )}
              >
                <LayoutDashboard className="size-5 text-primary" />
                {item.label}
              </Link>
            ))}

            <Button
              variant="outline"
              size="lg"
              className="mt-3 w-full justify-start gap-3"
              onClick={() => void onLogout()}
            >
              <LogOut className="size-5" />
              Cerrar sesión
            </Button>
          </nav>
        </div>
      ) : null}
    </div>
  )
}

export function StatTile({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: string
  hint?: string
  icon?: ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon && <span className="text-primary">{icon}</span>}
      </div>
      <p className="mt-2 font-serif text-3xl text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
