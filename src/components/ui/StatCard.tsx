import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from './Card'

type Tone = 'blue' | 'amber' | 'green' | 'gray' | 'red'

// 'blue' → marka teal'i; 'green' → emerald
const toneStyles: Record<Tone, string> = {
  blue: 'bg-teal-50 text-teal-700 ring-teal-600/15',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  gray: 'bg-slate-100 text-slate-600 ring-slate-500/15',
  red: 'bg-red-50 text-red-700 ring-red-600/15',
}

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'blue',
}: {
  icon: LucideIcon
  label: string
  value: number | string
  tone?: Tone
}) {
  return (
    <Card className="flex items-center gap-4 p-4 transition-shadow hover:shadow-md">
      <span
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset',
          toneStyles[tone],
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="text-xs font-medium text-[var(--color-muted)]">{label}</div>
        <div className="text-[1.7rem] font-extrabold leading-tight tracking-tight">
          {value}
        </div>
      </div>
    </Card>
  )
}
