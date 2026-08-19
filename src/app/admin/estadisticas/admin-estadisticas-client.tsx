"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRequireRoleTree } from "@/hooks/use-require-role-tree"
import { ApiError, apiErrorMessage } from "@/lib/api"
import {
  fetchAdminEstadisticas,
  type ApiAdminEstadisticas,
} from "@/lib/convites-api"
import { designTokenHex } from "@/lib/design-tokens"
import { perfilTabsForRole } from "@/lib/role-tree"

const ESTADO_LABEL: Record<string, string> = {
  borrador: "Borrador",
  en_revision: "En revisión",
  publicada: "Publicada",
  en_curso: "En curso",
  cerrada: "Cerrada",
  rechazada: "Rechazada",
}

const ESTADO_COLORS = [
  designTokenHex.chart5,
  designTokenHex.chart3,
  designTokenHex.chart2,
  designTokenHex.chart1,
  designTokenHex.chart4,
  designTokenHex.muted,
] as const

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isYmd(value: string | null): value is string {
  return Boolean(value && DATE_RE.test(value))
}

function formatAxisDay(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number)
  if (!y || !m || !d) return ymd
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`
}

function buildStatsQuery(opts: {
  start_date?: string | null
  end_date?: string | null
}): string {
  const params = new URLSearchParams()
  if (opts.start_date && DATE_RE.test(opts.start_date)) {
    params.set("start_date", opts.start_date)
  }
  if (opts.end_date && DATE_RE.test(opts.end_date)) {
    params.set("end_date", opts.end_date)
  }
  const s = params.toString()
  return s ? `?${s}` : ""
}

/** Mock P51-shaped payload so the UI is reviewable before the API lands. */
function mockEstadisticas(
  start: string | null,
  end: string | null,
): ApiAdminEstadisticas {
  const endDate = end && DATE_RE.test(end) ? end : "2026-08-19"
  const startDate = start && DATE_RE.test(start) ? start : "2026-08-05"
  const days: ApiAdminEstadisticas["usuarios_por_dia"] = []
  const startMs = Date.parse(`${startDate}T12:00:00`)
  const endMs = Date.parse(`${endDate}T12:00:00`)
  for (let t = startMs; t <= endMs; t += 86_400_000) {
    const fecha = new Date(t).toISOString().slice(0, 10)
    const i = days.length
    days.push({ fecha, total: i % 4 === 0 ? 2 : i % 3 === 0 ? 1 : 0 })
  }
  return {
    start_date: startDate,
    end_date: endDate,
    usuarios_por_dia: days,
    convites_por_dia: days.map((d, i) => ({
      fecha: d.fecha,
      total: i % 5 === 0 ? 1 : 0,
    })),
    convites_por_estado: [
      { estado: "borrador", total: 2 },
      { estado: "en_revision", total: 1 },
      { estado: "publicada", total: 5 },
      { estado: "en_curso", total: 3 },
      { estado: "cerrada", total: 4 },
      { estado: "rechazada", total: 1 },
    ],
    avance_global: { promedio: 62, convites_considerados: 8 },
  }
}

function ChartCard({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 md:p-5">
      <h2 className="font-serif text-lg text-foreground">{title}</h2>
      {hint ? (
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      ) : null}
      <div className="mt-4 h-64 w-full min-w-0">{children}</div>
    </section>
  )
}

export function AdminEstadisticasClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { user, token, loading: authLoading } = useRequireRoleTree(
    "/admin/estadisticas",
    "admin",
  )

  const urlStart = searchParams.get("start_date")
  const urlEnd = searchParams.get("end_date")
  const startDate = isYmd(urlStart) ? urlStart : null
  const endDate = isYmd(urlEnd) ? urlEnd : null

  const [data, setData] = useState<ApiAdminEstadisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rangeError, setRangeError] = useState<string | null>(null)
  const [usingMock, setUsingMock] = useState(false)

  function replaceQuery(next: {
    start_date?: string | null
    end_date?: string | null
  }) {
    const href =
      pathname +
      buildStatsQuery({
        start_date:
          next.start_date !== undefined ? next.start_date : startDate,
        end_date: next.end_date !== undefined ? next.end_date : endDate,
      })
    router.replace(href, { scroll: false })
  }

  useEffect(() => {
    if (authLoading || !token) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      setRangeError(null)
      try {
        const res = await fetchAdminEstadisticas(token!, {
          start_date: startDate ?? undefined,
          end_date: endDate ?? undefined,
        })
        if (cancelled) return
        setData(res)
        setUsingMock(false)
        if (!startDate || !endDate) {
          replaceQuery({
            start_date: res.start_date,
            end_date: res.end_date,
          })
        }
      } catch (err) {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 422) {
          setRangeError(
            apiErrorMessage(err, "El rango de fechas no es válido."),
          )
          setError(null)
          return
        }
        if (
          err instanceof ApiError &&
          (err.status === 404 || err.status === 501)
        ) {
          const mock = mockEstadisticas(startDate, endDate)
          setData(mock)
          setUsingMock(true)
          if (!startDate || !endDate) {
            replaceQuery({
              start_date: mock.start_date,
              end_date: mock.end_date,
            })
          }
          return
        }
        setError(
          apiErrorMessage(
            err,
            "No pudimos cargar las estadísticas. Intenta de nuevo.",
          ),
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
    // replaceQuery is stable enough via pathname/start/end; omit to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync on URL dates + auth
  }, [authLoading, token, startDate, endDate])

  const pickerStart = startDate ?? data?.start_date ?? ""
  const pickerEnd = endDate ?? data?.end_date ?? ""

  const estadoPie = useMemo(() => {
    if (!data) return []
    return data.convites_por_estado
      .filter((e) => e.total > 0)
      .map((e) => ({
        name: ESTADO_LABEL[e.estado] ?? e.estado,
        value: e.total,
        estado: e.estado,
      }))
  }, [data])

  const avancePie = useMemo(() => {
    if (!data || data.avance_global.convites_considerados === 0) return null
    const promedio = Math.min(100, Math.max(0, data.avance_global.promedio))
    return [
      { name: "Avance", value: promedio },
      { name: "Restante", value: 100 - promedio },
    ]
  }, [data])

  if (authLoading || !user) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-muted-foreground">
        Cargando…
      </div>
    )
  }

  return (
    <DashboardShell
      title="Estadísticas"
      subtitle="Usuarios, convites y avance en el rango que elijas."
      tabs={perfilTabsForRole(user, "/admin/estadisticas")}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="grid flex-1 gap-2 sm:max-w-xs">
          <Label htmlFor="stats-start">Desde</Label>
          <Input
            id="stats-start"
            type="date"
            value={pickerStart}
            aria-invalid={Boolean(rangeError)}
            onChange={(e) => {
              const v = e.target.value
              replaceQuery({ start_date: v || null })
            }}
          />
        </div>
        <div className="grid flex-1 gap-2 sm:max-w-xs">
          <Label htmlFor="stats-end">Hasta</Label>
          <Input
            id="stats-end"
            type="date"
            value={pickerEnd}
            aria-invalid={Boolean(rangeError)}
            onChange={(e) => {
              const v = e.target.value
              replaceQuery({ end_date: v || null })
            }}
          />
        </div>
      </div>

      {rangeError ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {rangeError}
        </p>
      ) : null}

      {usingMock ? (
        <p className="mb-4 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-foreground">
          Mostrando datos de ejemplo: el endpoint{" "}
          <code className="text-xs">GET /api/admin/estadisticas</code> (P51)
          todavía no está disponible.
        </p>
      ) : null}

      {error ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading && !data ? (
        <p className="text-sm text-muted-foreground">Cargando gráficos…</p>
      ) : null}

      {data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Usuarios registrados por día">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.usuarios_por_dia} margin={{ left: 0, right: 8 }}>
                <CartesianGrid stroke={designTokenHex.border} strokeDasharray="3 3" />
                <XAxis
                  dataKey="fecha"
                  tickFormatter={formatAxisDay}
                  tick={{ fill: designTokenHex.muted, fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: designTokenHex.muted, fontSize: 11 }}
                  width={32}
                />
                <Tooltip
                  labelFormatter={(label) =>
                    typeof label === "string" ? formatAxisDay(label) : String(label)
                  }
                  formatter={(value) => [Number(value ?? 0), "Usuarios"]}
                />
                <Bar
                  dataKey="total"
                  fill={designTokenHex.chart1}
                  radius={[4, 4, 0, 0]}
                  name="Usuarios"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Convites creados por día">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.convites_por_dia} margin={{ left: 0, right: 8 }}>
                <CartesianGrid stroke={designTokenHex.border} strokeDasharray="3 3" />
                <XAxis
                  dataKey="fecha"
                  tickFormatter={formatAxisDay}
                  tick={{ fill: designTokenHex.muted, fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: designTokenHex.muted, fontSize: 11 }}
                  width={32}
                />
                <Tooltip
                  labelFormatter={(label) =>
                    typeof label === "string" ? formatAxisDay(label) : String(label)
                  }
                  formatter={(value) => [Number(value ?? 0), "Convites"]}
                />
                <Bar
                  dataKey="total"
                  fill={designTokenHex.chart2}
                  radius={[4, 4, 0, 0]}
                  name="Convites"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Convites por estado"
            hint="Según la fecha del convite en el rango (no la fecha de creación)."
          >
            {estadoPie.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No hay convites con fecha en este rango.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={estadoPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={88}
                    label={({ name, percent }) =>
                      `${name} ${Math.round((percent ?? 0) * 100)}%`
                    }
                  >
                    {estadoPie.map((entry, i) => (
                      <Cell
                        key={entry.estado}
                        fill={ESTADO_COLORS[i % ESTADO_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [Number(value ?? 0), "Convites"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard
            title="Avance global"
            hint={
              data.avance_global.convites_considerados > 0
                ? `Promedio ${data.avance_global.promedio}% · ${data.avance_global.convites_considerados} convites`
                : undefined
            }
          >
            {!avancePie ? (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Sin convites con fecha en este rango para calcular avance.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={avancePie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={88}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill={designTokenHex.chart1} />
                    <Cell fill={designTokenHex.border} />
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [
                      `${Number(value ?? 0)}%`,
                      String(name),
                    ]}
                  />
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground font-serif text-2xl"
                  >
                    {`${data.avance_global.promedio}%`}
                  </text>
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      ) : null}
    </DashboardShell>
  )
}
