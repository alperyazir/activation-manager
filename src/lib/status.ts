import type { CodeStatus } from './database.types'

// Sunucudaki effective_code_status ile aynı mantık:
// süresi geçmiş 'active' kodları anlık 'expired' göster.
export function effectiveStatus(
  status: CodeStatus,
  expiresAt: string | null,
): CodeStatus {
  if (status === 'active' && expiresAt && new Date(expiresAt) < new Date()) {
    return 'expired'
  }
  return status
}
