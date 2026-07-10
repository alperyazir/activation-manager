import { useEffect, useState } from 'react'
import {
  FileText,
  Loader2,
  Plus,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  ShieldPlus,
  Trash2,
  Upload,
  UserX,
  type LucideIcon,
} from 'lucide-react'
import { callRpc } from '@/lib/supabase'
import { formatDateTime } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Pagination } from '@/components/ui/Pagination'
import { usePagination } from '@/lib/usePagination'

interface LogRow {
  id: string
  created_at: string
  action: string
  target_type: string | null
  target_id: string | null
  detail: Record<string, unknown>
  admin_email: string | null
}

type Detail = Record<string, unknown>

// İşlem → okunabilir etiket + ikon
function actionInfo(action: string): { label: string; icon: LucideIcon } {
  switch (action) {
    case 'generate_codes':
      return { label: 'Kod üretildi', icon: Plus }
    case 'bulk_import_codes':
      return { label: "Excel'den içe aktarıldı", icon: Upload }
    case 'add_code':
      return { label: 'Kod eklendi', icon: PlusCircle }
    case 'delete_code':
      return { label: 'Kod silindi', icon: Trash2 }
    case 'set_code_status':
      return { label: 'Kod durumu değişti', icon: RefreshCw }
    case 'bulk_set_code_status':
      return { label: 'Toplu durum değişti', icon: RefreshCw }
    case 'bulk_delete_codes':
      return { label: 'Toplu kod silindi', icon: Trash2 }
    case 'create_admin':
      return { label: 'Yönetici oluşturuldu', icon: ShieldPlus }
    case 'set_admin_active':
      return { label: 'Yönetici durumu değişti', icon: ShieldCheck }
    case 'delete_registration':
      return { label: 'Öğrenci kaydı silindi', icon: UserX }
    case 'purge_registrations':
      return { label: 'Eski kayıtlar temizlendi', icon: Trash2 }
    default:
      return { label: action, icon: FileText }
  }
}

const statusTr = (s: unknown) =>
  s === 'active' ? 'Aktif' : s === 'passive' ? 'Pasif' : String(s ?? '—')

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-[var(--color-bg)] px-1.5 py-0.5 font-mono text-xs text-[var(--color-fg)]">
      {children}
    </span>
  )
}

// Detayı okunabilir bir ifadeye çevir (hangi kod/kişi vurgulanır)
function describe(action: string, d: Detail): React.ReactNode {
  switch (action) {
    case 'generate_codes':
      return (
        <>
          <strong>{String(d.count ?? '?')}</strong> adet kod
          {d.label ? ` · ${d.label}` : ''}
        </>
      )
    case 'bulk_import_codes':
      return `${d.imported ?? 0} eklendi, ${d.skipped ?? 0} atlandı`
    case 'add_code':
      return <Mono>{String(d.code ?? '—')}</Mono>
    case 'delete_code':
      return (
        <>
          <Mono>{String(d.code ?? '—')}</Mono> silindi
        </>
      )
    case 'set_code_status':
      return (
        <>
          <Mono>{String(d.code ?? '—')}</Mono> → {statusTr(d.status)}
        </>
      )
    case 'bulk_set_code_status':
      return (
        <>
          <strong>{String(d.count ?? 0)}</strong> kod → {statusTr(d.status)}
        </>
      )
    case 'bulk_delete_codes':
      return `${d.deleted ?? 0} silindi${d.skipped ? `, ${d.skipped} atlandı` : ''}`
    case 'create_admin':
      return <Mono>{String(d.email ?? '—')}</Mono>
    case 'set_admin_active':
      return (
        <>
          <Mono>{String(d.email ?? '—')}</Mono> → {d.active ? 'Aktif' : 'Pasif'}
        </>
      )
    case 'delete_registration':
      return (
        <>
          Kod: <Mono>{String(d.code ?? '—')}</Mono>
        </>
      )
    case 'purge_registrations':
      return `${d.older_than_days ?? '?'} günden eski · ${d.deleted ?? 0} silindi`
    default:
      return (
        <span className="font-mono text-xs text-[var(--color-muted)]">
          {JSON.stringify(d)}
        </span>
      )
  }
}

export default function Logs() {
  const [logs, setLogs] = useState<LogRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    callRpc('list_audit_logs', { p_limit: 500 }).then(({ data }) => {
      setLogs((data as LogRow[]) ?? [])
      setLoading(false)
    })
  }, [])

  const { page, setPage, pageCount, pageSize, total, paged } = usePagination(logs, 15)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">İşlem Logları</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Yönetici işlemleri denetim kaydı (son 500)
        </p>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-bg)] text-left text-xs uppercase text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3">Tarih</th>
                <th className="px-4 py-3">Yönetici</th>
                <th className="px-4 py-3">İşlem</th>
                <th className="px-4 py-3">Ayrıntı</th>
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
                paged.map((l) => {
                  const info = actionInfo(l.action)
                  return (
                    <tr key={l.id} className="hover:bg-[var(--color-bg)]">
                      <td className="whitespace-nowrap px-4 py-3 text-[var(--color-muted)]">
                        {formatDateTime(l.created_at)}
                      </td>
                      <td className="px-4 py-3">{l.admin_email ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2 font-medium">
                          <info.icon className="h-4 w-4 text-[var(--color-muted)]" />
                          {info.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">{describe(l.action, l.detail)}</td>
                    </tr>
                  )
                })
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
