"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { cn } from "@/lib/utils"

type Tab = {
  href: string
  label: string
  active?: boolean
  badge?: number | null
}

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
              {tabs.map((t) => {
                const showBadge =
                  typeof t.badge === "number" && t.badge > 0
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    aria-current={t.active ? "page" : undefined}
                    className={cn(
                      "-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                      t.active
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t.label}
                    {showBadge ? (
                      <span
                        className={cn(
                          "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums",
                          t.active
                            ? "bg-primary text-primary-foreground"
                            : "bg-warning/20 text-warning",
                        )}
                        aria-label={`${t.badge} pendientes`}
                      >
                        {t.badge! > 99 ? "99+" : t.badge}
                      </span>
                    ) : null}
                  </Link>
                )
              })}
            </nav>
          ) : null}

          {children}
        </div>
      </main>
      <SiteFooter />
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
