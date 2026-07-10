import { cn } from '@/lib/utils'
import type { CodeStatus, RegistrationStatus } from '@/lib/database.types'

const base =
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'

const codeStyles: Record<CodeStatus, string> = {
  active: 'bg-green-100 text-green-800',
  used: 'bg-blue-100 text-blue-800',
  passive: 'bg-gray-100 text-gray-700',
  expired: 'bg-red-100 text-red-800',
}

const codeLabels: Record<CodeStatus, string> = {
  active: 'Aktif',
  used: 'Kullanıldı',
  passive: 'Pasif',
  expired: 'Süresi Doldu',
}

const regStyles: Record<RegistrationStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  completed: 'bg-green-100 text-green-800',
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
