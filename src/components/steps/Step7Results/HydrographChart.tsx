import { AreaChart, Area, Line, LineChart, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer, type TooltipProps } from 'recharts'
import { useUIStore } from '@/store/useUIStore'
import type { TR55Results } from '@/types/results'
import type { ReturnPeriod } from '@/types/project'

const PERIOD_COLORS: Record<ReturnPeriod, string> = {
  1: '#94a3b8',
  2: '#22d3ee',
  5: '#34d399',
  10: '#fbbf24',
  25: '#f97316',
  50: '#ef4444',
  100: '#a855f7',
}

function CustomTooltip({ active, payload, label, tooltipBg, tooltipBorder, tooltipLabel }: TooltipProps<number, string> & { tooltipBg: string; tooltipBorder: string; tooltipLabel: string }) {
  if (!active || !payload?.length) return null
  const filtered = payload.filter((p) => !String(p.dataKey).includes('_storage') && !String(p.dataKey).includes('_pre'))
  const preFiltered = payload.filter((p) => String(p.dataKey).includes('_pre'))
  if (!filtered.length && !preFiltered.length) return null
  return (
    <div style={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 6, padding: '8px 12px', fontSize: 12 }}>
      <p style={{ color: tooltipLabel, marginBottom: 4 }}>{`t = ${Number(label).toFixed(2)} hr`}</p>
      {filtered.map((entry) => (
        <p key={String(entry.dataKey)} style={{ color: entry.color, margin: '2px 0' }}>
          {entry.name}: {Number(entry.value).toFixed(1)} cfs
        </p>
      ))}
      {preFiltered.map((entry) => (
        <p key={String(entry.dataKey)} style={{ color: entry.color, margin: '2px 0', opacity: 0.7 }}>
          {entry.name}: {Number(entry.value).toFixed(1)} cfs
        </p>
      ))}
    </div>
  )
}

interface HydrographChartProps {
  results: TR55Results
}

export function HydrographChart({ results }: HydrographChartProps) {
  const theme = useUIStore((s) => s.theme)
  const isDark = theme === 'dark'

  const gridColor = isDark ? '#3f3f46' : '#e4e4e7'
  const axisColor = isDark ? '#71717a' : '#a1a1aa'
  const tickColor = isDark ? '#a1a1aa' : '#71717a'
  const tooltipBg = isDark ? '#27272a' : '#ffffff'
  const tooltipBorder = isDark ? '#3f3f46' : '#e4e4e7'
  const tooltipLabel = isDark ? '#e4e4e7' : '#18181b'
  const legendColor = isDark ? '#a1a1aa' : '#71717a'

  const periods = Object.keys(results.hydrographs).map(Number) as ReturnPeriod[]
  const hasPre = !!results.preDev

  // Build qo lookup
  const qoMap: Partial<Record<ReturnPeriod, number>> = {}
  for (const row of results.detentionBasin) {
    qoMap[row.returnPeriod] = row.allowableOutflowCfs
  }

  // Merge all time steps (post-dev + pre-dev)
  const allTimes = new Set<number>()
  for (const p of periods) {
    results.hydrographs[p]?.forEach((pt) => allTimes.add(pt.timeHr))
    results.preDev?.hydrographs[p]?.forEach((pt) => allTimes.add(pt.timeHr))
  }
  const sortedTimes = Array.from(allTimes).sort((a, b) => a - b)

  const data = sortedTimes.map((t) => {
    const row: Record<string, number> = { time: t }
    for (const p of periods) {
      const qo = qoMap[p] ?? 0
      const pt = results.hydrographs[p]?.find((h) => h.timeHr === t)
      const flow = pt?.flowCfs ?? 0
      row[`${p}yr`] = flow
      row[`${p}yr_storage`] = qo > 0 ? Math.max(flow, qo) : flow

      if (hasPre) {
        const prePt = results.preDev!.hydrographs[p]?.find((h) => h.timeHr === t)
        row[`${p}yr_pre`] = prePt?.flowCfs ?? 0
      }
    }
    return row
  })

  const periodsWithQo = periods.filter((p) => (qoMap[p] ?? 0) > 0)

  return (
    <div className="space-y-3">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 48, left: 10, bottom: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="time"
              stroke={axisColor}
              tick={{ fill: tickColor, fontSize: 11 }}
              label={{ value: 'Time (hr)', position: 'insideBottom', offset: -8, fill: axisColor, fontSize: 11 }}
            />
            <YAxis
              stroke={axisColor}
              tick={{ fill: tickColor, fontSize: 11 }}
              label={{ value: 'Q (cfs)', angle: -90, position: 'insideLeft', fill: axisColor, fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip tooltipBg={tooltipBg} tooltipBorder={tooltipBorder} tooltipLabel={tooltipLabel} />} />
            <Legend
              verticalAlign="top"
              wrapperStyle={{ fontSize: 12, color: legendColor, paddingBottom: 8 }}
            />

            {/* Storage wedge fills (above qo) */}
            {periodsWithQo.map((p) => (
              <Area
                key={`storage_${p}`}
                type="monotone"
                dataKey={`${p}yr_storage`}
                baseValue={qoMap[p]}
                stroke="none"
                fill={PERIOD_COLORS[p]}
                fillOpacity={0.2}
                legendType="none"
                dot={false}
                isAnimationActive={false}
              />
            ))}

            {/* Post-dev inflow areas */}
            {periods.map((p) => (
              <Area
                key={`post_${p}`}
                type="monotone"
                dataKey={`${p}yr`}
                name={`${p}-yr (post)`}
                stroke={PERIOD_COLORS[p]}
                fill={PERIOD_COLORS[p]}
                fillOpacity={0.05}
                strokeWidth={2}
                dot={false}
              />
            ))}

            {/* Pre-dev dashed lines (same hue, dashed stroke, no fill) */}
            {hasPre && periods.map((p) => (
              <Line
                key={`pre_${p}`}
                type="monotone"
                dataKey={`${p}yr_pre`}
                name={`${p}-yr (pre)`}
                stroke={PERIOD_COLORS[p]}
                strokeWidth={1.5}
                strokeDasharray="5 3"
                dot={false}
                legendType="line"
              />
            ))}

            {/* qo reference lines */}
            {periodsWithQo.map((p) => (
              <ReferenceLine
                key={`qo_${p}`}
                y={qoMap[p]}
                stroke={PERIOD_COLORS[p]}
                strokeDasharray="2 2"
                strokeWidth={1}
                label={{ value: `qo ${p}-yr`, fill: PERIOD_COLORS[p], fontSize: 9, position: 'right' }}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Annotation row */}
      {periodsWithQo.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 px-1">
          {periodsWithQo.map((p) => {
            const row = results.detentionBasin.find((r) => r.returnPeriod === p)
            if (!row) return null
            const preQp = results.preDev?.peakDischarge[p]
            return (
              <span key={p} className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
                <span style={{ color: PERIOD_COLORS[p] }}>■</span>{' '}
                {p}-yr:{preQp !== undefined ? ` pre = ${preQp.toFixed(1)} →` : ''} post = {row.inflowCfs.toFixed(1)} → qo = {row.allowableOutflowCfs.toFixed(1)} cfs, Vs = {row.requiredStorageAcreFt.toFixed(3)} ac-ft
              </span>
            )
          })}
          <p className="w-full text-[10px] text-zinc-600 dark:text-zinc-500 italic">
            Solid = post-dev inflow · Dashed = pre-dev inflow · Shaded = conceptual detention storage · Dotted = allowable outflow (qo)
          </p>
        </div>
      )}
    </div>
  )
}
