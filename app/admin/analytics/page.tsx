"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useTheme } from "next-themes"
import { RefreshCw, TrendingUp } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Overview {
  pageviews: number
  uniqueVisitors: number
  uniqueSessions: number
  avgPerVisitor: number
  topPages: { path: string; count: number }[]
  topReferrers: { referrer: string; count: number }[]
}

interface TsPoint {
  period: string
  pageviews: number
  unique_visitors: number
}

interface PageRow {
  path: string
  pageviews: number
  unique_visitors: number
}

interface DeviceData {
  devices: { name: string; count: number }[]
  browsers: { name: string; count: number }[]
  os_list: { name: string; count: number }[]
}

type Preset = "today" | "7d" | "30d" | "12m" | "custom"
type Interval = "day" | "week" | "month" | "year"
type SortCol = "path" | "pageviews" | "unique_visitors"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(d: Date) {
  return d.toISOString().slice(0, 10)
}

function presetDates(p: Preset): { from: string; to: string; interval: Interval } {
  const now = new Date()
  if (p === "today")
    return { from: fmt(now), to: fmt(now), interval: "day" }
  if (p === "7d")
    return {
      from: fmt(new Date(now.getTime() - 6 * 86_400_000)),
      to: fmt(now),
      interval: "week",
    }
  if (p === "12m")
    return {
      from: fmt(new Date(now.getTime() - 364 * 86_400_000)),
      to: fmt(now),
      interval: "year",
    }
  // 30d default
  return {
    from: fmt(new Date(now.getTime() - 29 * 86_400_000)),
    to: fmt(now),
    interval: "month",
  }
}

function fmtPeriod(period: string, interval: Interval): string {
  try {
    if (interval === "day") {
      // "2026-04-24 14:00" → "14:00"
      return period.slice(11, 16)
    }
    if (interval === "year") {
      // "2026-04" → "Apr 26"
      const [y, m] = period.split("-")
      const date = new Date(parseInt(y), parseInt(m) - 1, 1)
      return date.toLocaleDateString("de-DE", { month: "short", year: "2-digit" })
    }
    // daily: "2026-04-24" → "24.04."
    const [, m, d] = period.split("-")
    return `${d}.${m}.`
  } catch {
    return period
  }
}

function topN<T extends { count: number; name?: string }>(
  arr: T[],
  n = 5
): T[] {
  if (arr.length <= n) return arr
  const top = arr.slice(0, n)
  const rest = arr.slice(n).reduce((s, x) => s + x.count, 0)
  if (rest > 0) top.push({ ...top[0], name: "Sonstige", count: rest })
  return top
}

const CHART_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
    </div>
  )
}

function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="mb-4 text-sm font-semibold">{title}</p>
      {children}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const gridColor = isDark ? "#2d2d2d" : "#e5e7eb"
  const axisColor = isDark ? "#6b7280" : "#9ca3af"
  const tooltipBg = isDark ? "#1f2937" : "#ffffff"
  const tooltipBorder = isDark ? "#374151" : "#e5e7eb"
  const tooltipText = isDark ? "#f9fafb" : "#111827"

  // Date range
  const [preset, setPreset] = useState<Preset>("30d")
  const initial = presetDates("30d")
  const [from, setFrom] = useState(initial.from)
  const [to, setTo] = useState(initial.to)
  const [interval, setIntervalType] = useState<Interval>(initial.interval)

  // Data
  const [overview, setOverview] = useState<Overview | null>(null)
  const [timeseries, setTimeseries] = useState<TsPoint[]>([])
  const [pages, setPages] = useState<PageRow[]>([])
  const [devices, setDevices] = useState<DeviceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Table state
  const [tablePage, setTablePage] = useState(0)
  const [sortCol, setSortCol] = useState<SortCol>("pageviews")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  // Mount guard for recharts SSR
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const qs = useCallback(
    () => `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    [from, to]
  )

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [ov, ts, pg, dv] = await Promise.all([
        fetch(`/api/admin/analytics/overview?${qs()}`).then((r) => r.json()),
        fetch(
          `/api/admin/analytics/timeseries?${qs()}&interval=${interval}`
        ).then((r) => r.json()),
        fetch(`/api/admin/analytics/pages?${qs()}&limit=1000`).then((r) =>
          r.json()
        ),
        fetch(`/api/admin/analytics/devices?${qs()}`).then((r) => r.json()),
      ])
      setOverview(ov)
      setTimeseries(Array.isArray(ts) ? ts : [])
      setPages(Array.isArray(pg) ? pg : [])
      setDevices(dv && typeof dv === "object" ? dv : null)
      setLastRefresh(new Date())
    } catch {
      // ignore – data stays stale
    } finally {
      setLoading(false)
    }
  }, [qs, interval])

  // Initial fetch + auto-refresh every 60 s
  useEffect(() => {
    fetchData()
    const timer = setInterval(fetchData, 60_000)
    return () => clearInterval(timer)
  }, [fetchData])

  // Table sorting + pagination
  const PAGE_SIZE = 20
  const sorted = [...pages].sort((a, b) => {
    const av = a[sortCol] as string | number
    const bv = b[sortCol] as string | number
    if (av < bv) return sortDir === "asc" ? -1 : 1
    if (av > bv) return sortDir === "asc" ? 1 : -1
    return 0
  })
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const tablRows = sorted.slice(tablePage * PAGE_SIZE, (tablePage + 1) * PAGE_SIZE)

  function handleSort(col: SortCol) {
    if (col === sortCol) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortCol(col)
      setSortDir("desc")
    }
    setTablePage(0)
  }

  function applyPreset(p: Preset) {
    setPreset(p)
    if (p !== "custom") {
      const d = presetDates(p)
      setFrom(d.from)
      setTo(d.to)
      setIntervalType(d.interval)
      setTablePage(0)
    }
  }

  const chartData = timeseries.map((t) => ({
    ...t,
    label: fmtPeriod(t.period, interval),
  }))

  const topPagesBar = (overview?.topPages ?? []).map((p) => ({
    name:
      p.path.length > 30 ? "…" + p.path.slice(-28) : p.path,
    count: p.count,
  }))

  const topRefBar = (overview?.topReferrers ?? []).map((r) => ({
    name:
      r.referrer.length > 35 ? "…" + r.referrer.slice(-33) : r.referrer,
    count: r.count,
  }))

  const devicesData = topN(devices?.devices ?? [])
  const browsersData = topN(devices?.browsers ?? [])
  const osData = topN(devices?.os_list ?? [])

  const tooltipStyle = {
    backgroundColor: tooltipBg,
    border: `1px solid ${tooltipBorder}`,
    borderRadius: "8px",
    color: tooltipText,
    fontSize: "12px",
  }

  const PRESETS: { key: Preset; label: string }[] = [
    { key: "today", label: "Heute" },
    { key: "7d", label: "7 Tage" },
    { key: "30d", label: "30 Tage" },
    { key: "12m", label: "12 Monate" },
    { key: "custom", label: "Benutzerdefiniert" },
  ]

  const INTERVALS: { key: Interval; label: string }[] = [
    { key: "day", label: "Pro Stunde" },
    { key: "week", label: "Pro Tag" },
    { key: "month", label: "Pro Woche" },
    { key: "year", label: "Pro Monat" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-xs text-muted-foreground">
              Aktualisiert:{" "}
              {lastRefresh.toLocaleTimeString("de-DE", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted disabled:opacity-50"
            title="Manuell aktualisieren"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Date range presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => applyPreset(key)}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              preset === key
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {label}
          </button>
        ))}
        {preset === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => {
                setFrom(e.target.value)
                setTablePage(0)
              }}
              className="rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
            />
            <span className="text-muted-foreground">–</span>
            <input
              type="date"
              value={to}
              min={from}
              max={fmt(new Date())}
              onChange={(e) => {
                setTo(e.target.value)
                setTablePage(0)
              }}
              className="rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
            />
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Seitenaufrufe gesamt"
          value={overview?.pageviews.toLocaleString("de-DE") ?? "—"}
        />
        <KpiCard
          label="Unique Besucher"
          value={overview?.uniqueVisitors.toLocaleString("de-DE") ?? "—"}
        />
        <KpiCard
          label="Unique Sessions"
          value={overview?.uniqueSessions.toLocaleString("de-DE") ?? "—"}
        />
        <KpiCard
          label="Ø Aufrufe / Besucher"
          value={overview?.avgPerVisitor ?? "—"}
        />
      </div>

      {/* Timeseries Chart */}
      <SectionCard title="Zeitlicher Verlauf">
        <div className="mb-3 flex flex-wrap gap-2">
          {INTERVALS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                setIntervalType(key)
                setTablePage(0)
              }}
              className={`rounded-lg px-3 py-1 text-xs transition-colors ${
                interval === key
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {mounted ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={chartData}
              margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="label"
                tick={{ fill: axisColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: axisColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                wrapperStyle={{ fontSize: "12px" }}
                formatter={(value) =>
                  value === "pageviews" ? "Seitenaufrufe" : "Unique Besucher"
                }
              />
              <Line
                type="monotone"
                dataKey="pageviews"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="unique_visitors"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] animate-pulse rounded-xl bg-muted" />
        )}
      </SectionCard>

      {/* Top Pages + Top Referrers */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Top 10 meistbesuchte Seiten">
          {mounted ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                layout="vertical"
                data={topPagesBar}
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fill: axisColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  tick={{ fill: axisColor, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] animate-pulse rounded-xl bg-muted" />
          )}
        </SectionCard>

        <SectionCard title="Top 10 Referrer">
          {mounted ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                layout="vertical"
                data={topRefBar}
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fill: axisColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  tick={{ fill: axisColor, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] animate-pulse rounded-xl bg-muted" />
          )}
        </SectionCard>
      </div>

      {/* Donut Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        {(
          [
            { title: "Gerätetypen", data: devicesData },
            { title: "Browser", data: browsersData },
            { title: "Betriebssysteme", data: osData },
          ] as { title: string; data: { name: string; count: number }[] }[]
        ).map(({ title, data }) => (
          <SectionCard key={title} title={title}>
            {mounted ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="count"
                    nameKey="name"
                    paddingAngle={2}
                  >
                    {data.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value, name) => [
                      typeof value === "number"
                        ? value.toLocaleString("de-DE")
                        : String(value),
                      String(name),
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px" }}
                    iconSize={8}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] animate-pulse rounded-xl bg-muted" />
            )}
          </SectionCard>
        ))}
      </div>

      {/* Detailed Table */}
      <div className="rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <TrendingUp size={16} className="text-muted-foreground" />
          <p className="text-sm font-semibold">
            Alle Seiten ({pages.length})
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                {(
                  [
                    { col: "path", label: "Pfad" },
                    { col: "pageviews", label: "Seitenaufrufe" },
                    { col: "unique_visitors", label: "Unique Besucher" },
                  ] as { col: SortCol; label: string }[]
                ).map(({ col, label }) => (
                  <th
                    key={col}
                    className="cursor-pointer px-5 py-3 font-medium hover:text-foreground"
                    onClick={() => handleSort(col)}
                  >
                    {label}
                    {sortCol === col && (
                      <span className="ml-1">
                        {sortDir === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                ))}
                <th className="px-5 py-3 font-medium">% Gesamt</th>
              </tr>
            </thead>
            <tbody>
              {tablRows.map((row, i) => (
                <tr
                  key={row.path}
                  className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/30"}`}
                >
                  <td
                    className="max-w-[260px] truncate px-5 py-3 font-mono text-xs"
                    title={row.path}
                  >
                    {row.path}
                  </td>
                  <td className="px-5 py-3 tabular-nums">
                    {row.pageviews.toLocaleString("de-DE")}
                  </td>
                  <td className="px-5 py-3 tabular-nums">
                    {row.unique_visitors.toLocaleString("de-DE")}
                  </td>
                  <td className="px-5 py-3 tabular-nums text-muted-foreground">
                    {overview && overview.pageviews > 0
                      ? ((row.pageviews / overview.pageviews) * 100).toFixed(
                          1
                        ) + "%"
                      : "—"}
                  </td>
                </tr>
              ))}
              {tablRows.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-8 text-center text-muted-foreground"
                  >
                    Noch keine Daten für diesen Zeitraum.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <span className="text-xs text-muted-foreground">
              Seite {tablePage + 1} von {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={tablePage === 0}
                onClick={() => setTablePage((p) => p - 1)}
                className="rounded-lg border border-border px-3 py-1 text-xs disabled:opacity-40 hover:bg-muted"
              >
                Zurück
              </button>
              <button
                disabled={tablePage >= totalPages - 1}
                onClick={() => setTablePage((p) => p + 1)}
                className="rounded-lg border border-border px-3 py-1 text-xs disabled:opacity-40 hover:bg-muted"
              >
                Weiter
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
