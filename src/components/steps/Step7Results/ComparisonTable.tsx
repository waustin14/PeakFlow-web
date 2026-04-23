import { CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import type { TR55Results } from '@/types/results'
import type { ReturnPeriod } from '@/types/project'

interface ComparisonTableProps {
  results: TR55Results
}

export function ComparisonTable({ results }: ComparisonTableProps) {
  const { preDev } = results
  if (!preDev) return null

  const periods = results.peakDischarge.map((r) => r.returnPeriod) as ReturnPeriod[]

  return (
    <Card className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-zinc-900 dark:text-white flex items-center gap-2">
          Pre- vs. Post-Development Peak Discharge
          <InfoTooltip content="Regulatory check: post-development controlled outflow (qo) must not exceed the pre-development peak discharge. If no qo is entered, the uncontrolled post-dev peak is compared." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-200 dark:border-zinc-700">
              <TableHead className="text-zinc-500 dark:text-zinc-400 text-xs h-9">Period</TableHead>
              <TableHead className="text-zinc-500 dark:text-zinc-400 text-xs h-9">Pre-Dev qp (cfs)</TableHead>
              <TableHead className="text-zinc-500 dark:text-zinc-400 text-xs h-9">Post-Dev qp (cfs)</TableHead>
              <TableHead className="text-zinc-500 dark:text-zinc-400 text-xs h-9">Allowable qo (cfs)</TableHead>
              <TableHead className="text-zinc-500 dark:text-zinc-400 text-xs h-9">Controlled (cfs)</TableHead>
              <TableHead className="text-zinc-400 text-xs h-9 font-semibold">Meets Pre-Dev?</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {periods.map((period) => {
              const preQp = preDev.peakDischarge[period] ?? 0
              const postRow = results.peakDischarge.find((r) => r.returnPeriod === period)
              const postQp = postRow?.peakDischargeCfs ?? 0
              const detRow = results.detentionBasin.find((r) => r.returnPeriod === period)
              const qo = detRow?.allowableOutflowCfs ?? 0
              // Controlled discharge: use qo if set, otherwise uncontrolled post-dev peak
              const controlled = qo > 0 ? qo : postQp
              const meets = preQp > 0 && controlled <= preQp + 0.05

              return (
                <TableRow key={period} className="border-zinc-200 dark:border-zinc-700">
                  <TableCell className="text-zinc-600 dark:text-zinc-300 text-xs font-medium">{period}-yr</TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-300 text-xs tabular-nums">{preQp.toFixed(1)}</TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-300 text-xs tabular-nums">{postQp.toFixed(1)}</TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-300 text-xs tabular-nums">
                    {qo > 0 ? qo.toFixed(1) : <span className="text-zinc-400 italic">not set</span>}
                  </TableCell>
                  <TableCell className="text-zinc-900 dark:text-white text-xs font-semibold tabular-nums">{controlled.toFixed(1)}</TableCell>
                  <TableCell>
                    {meets ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-500">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Pass
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-red-500">
                        <XCircle className="h-3.5 w-3.5" />
                        Exceeds by {(controlled - preQp).toFixed(1)} cfs
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        <p className="text-[10px] text-zinc-500 dark:text-zinc-500 mt-2 italic">
          "Meets Pre-Dev" compares the controlled outflow (qo when set, otherwise uncontrolled post-dev peak) against the pre-development peak.
          A 0.05 cfs tolerance is applied. Pre-dev uses the same Tc — actual pre-dev Tc is typically longer, which would reduce the pre-dev peak.
        </p>
      </CardContent>
    </Card>
  )
}
