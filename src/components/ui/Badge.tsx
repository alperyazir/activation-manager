import { cn } from '@/lib/utils'
import type { CodeStatus, RegistrationStatus } from '@/lib/database.types'

const base =
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset'

const codeStyles: Record<CodeStatus, string> = {
  active: 'bg-teal-50 text-teal-700 ring-teal-600/20',
  used: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  passive: 'bg-gray-100 text-gray-600 ring-gray-500/20',
  expired: 'bg-red-50 text-red-700 ring-red-600/20',
}

const codeLabels: Record<CodeStatus, string> = {
  active: 'Aktif',
  used: 'Kullanıldı',
  passive: 'Pasif',
  expired: 'Süresi Doldu',
}

const regStyles: Record<RegistrationStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
}

const regLabels: Record<RegistrationStatus, string> = {
  pending: 'Onay Bekliyor',
  completed: 'Tamamlandı',
}

export function CodeStatusBadge({ status }: { status: CodeStatus }) {
  return <span className={cn(base, codeStyles[status])}>{codeLabels[status]}</span>
}

export function RegistrationStatusBadge({ status }: { status: RegistrationStatus }) {
  return <span className={cn(base, regStyles[status])}>{regLabels[status]}</span>
}
