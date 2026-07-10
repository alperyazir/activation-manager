import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { AdminAuditLog } from '@/lib/database.types'
import { formatDateTime } from '@/lib/utils'
import { usePagination } from '@/lib/usePagination'
import { Card } from '@/components/ui/Card'
import { Pagination } from '@/components/ui/Pagination'

const actionLabels: Record<string, string> = {
  generate_codes: 'Kod üretti',
  bulk_import_codes: 'Kod içe aktardı',
  set_code_status: 'Kod durumu değiştirdi',
}

export default function Logs() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
      .then(({ data }) => {
        setLogs(data ?? [])
        setLoading(false)
      })
  }, [])

  const { page, setPage, pageCount, pageSize, total, paged } = usePagination(logs, 15)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">İşlem Logları</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Admin işlemleri denetim kaydı (son 500)
        </p>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-bg)] text-left text-xs uppercase text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3">Tarih</th>
                <th className="px-4 py-3">İşlem</th>
                <th className="px-4 py-3">Hedef</th>
                <th className="px-4 py-3">Detay</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-[var(--color-muted)]">
                    Henüz işlem kaydı yok.
                  </td>
                </tr>
              ) : (
                paged.map((l) => (
                  <tr key={l.id} className="hover:bg-[var(--color-bg)]">
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--color-muted)]">
                      {formatDateTime(l.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {actionLabels[l.action] ?? l.action}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">
                      {l.target_type ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-muted)]">
                      {JSON.stringify(l.detail)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && (
          <Pagination
            page={page}
            pageCount={pageCount}
            total={total}
            pageSize={pageSize}
            onPage={setPage}
          />
        )}
      </Card>
    </div>
  )
}
