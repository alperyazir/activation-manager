import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from './Card'

type Tone = 'blue' | 'amber' | 'green' | 'gray' | 'red'

const toneStyles: Record<Tone, string> = {
  blue: 'bg-blue-100 text-blue-700',
  amber: 'bg-amber-100 text-amber-700',
  green: 'bg-green-100 text-green-700',
  gray: 'bg-gray-100 text-gray-600',
  red: 'bg-red-100 text-red-700',
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
    <Card className="flex items-center gap-4 p-4">
      <span
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
          toneStyles[tone],
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="text-xs font-medium text-[var(--color-muted)]">{label}</div>
        <div className="text-2xl font-bold leading-tight">{value}</div>
      </div>
    </Card>
  )
}
