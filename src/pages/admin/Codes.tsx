import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Ban,
  CheckCircle2,
  Clock,
  Download,
  FileDown,
  KeyRound,
  Loader2,
  Plus,
  PlusCircle,
  Power,
  PowerOff,
  RefreshCw,
  Upload,
} from 'lucide-react'
import { supabase, callRpc } from '@/lib/supabase'
import type { ActivationCode, CodeStatus } from '@/lib/database.types'
import { formatDateTime, formatDate } from '@/lib/utils'
import { exportToExcel, readCodesFromExcel, downloadCodeTemplate } from '@/lib/excel'
import { effectiveStatus } from '@/lib/status'
import { usePagination } from '@/lib/usePagination'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Pagination } from '@/components/ui/Pagination'
import { CodeStatusBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'

type StudentRef = { first_name: string; last_name: string }
type CodeWithReg = ActivationCode & {
  registration: StudentRef | StudentRef[] | null
}

function usedByName(reg: CodeWithReg['registration']): string | null {
  const r = Array.isArray(reg) ? reg[0] : reg
  return r ? `${r.first_name} ${r.last_name}` : null
}

export default function Codes() {
  const [codes, setCodes] = useState<CodeWithReg[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [genOpen, setGenOpen] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('activation_codes')
      .select('*, registration:student_registrations(first_name, last_name)')
      .order('created_at', { ascending: false })
    setCodes((data as unknown as CodeWithReg[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const rows = useMemo(
    () =>
      codes.map((c) => ({ ...c, eff: effectiveStatus(c.status, c.expires_at) })),
    [codes],
  )
  const filtered = useMemo(
    () => rows.filter((r) => (statusFilter ? r.eff === statusFilter : true)),
    [rows, statusFilter],
  )
  const { page, setPage, pageCount, pageSize, total, paged } = usePagination(
    filtered,
    15,
    statusFilter,
  )

  const counts = useMemo(() => {
    const c: Record<string, number> = { active: 0, used: 0, passive: 0, expired: 0 }
    rows.forEach((r) => (c[r.eff] += 1))
    return c
  }, [rows])

  async function handleExport() {
    await exportToExcel(
      'aktivasyon-kodlari.xlsx',
      [
        { header: 'Kod', value: (r: (typeof filtered)[number]) => r.code },
        {
          header: 'Durum',
          value: (r: (typeof filtered)[number]) => statusLabel(r.eff),
        },
        {
          header: 'Son Kullanma',
          value: (r: (typeof filtered)[number]) => formatDate(r.expires_at),
        },
        {
          header: 'Oluşturma',
          value: (r: (typeof filtered)[number]) => formatDate(r.created_at),
        },
        {
          header: 'Kullanım Tarihi',
          value: (r: (typeof filtered)[number]) => formatDateTime(r.used_at),
        },
      ],
      filtered,
    )
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportMsg(null)
    try {
      const list = await readCodesFromExcel(file)
      if (list.length === 0) {
        setImportMsg('Dosyada kod bulunamadı.')
        return
      }
      const { data, error } = await callRpc('bulk_import_codes', {
        p_codes: list,
        p_expires_at: null,
        p_label: file.name,
      })
      if (error) {
        setImportMsg('İçe aktarma başarısız.')
        return
      }
      const r = data as { imported: number; skipped: number }
      setImportMsg(`${r.imported} kod eklendi, ${r.skipped} atlandı.`)
      load()
    } catch {
      setImportMsg('Dosya okunamadı. Geçerli bir Excel dosyası seçin.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function toggleStatus(c: ActivationCode) {
    const next: CodeStatus = c.status === 'passive' ? 'active' : 'passive'
    await callRpc('set_code_status', { p_code_id: c.id, p_status: next })
    load()
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Aktivasyon Kodları</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Toplam {rows.length} kod
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImport}
          />
          <Button variant="outline" onClick={() => downloadCodeTemplate()}>
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">Şablon İndir</span>
            <span className="sm:hidden">Şablon</span>
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Excel İçe Aktar</span>
            <span className="sm:hidden">İçe</span>
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Excel'e Aktar</span>
            <span className="sm:hidden">Dışa</span>
          </Button>
          <Button variant="outline" onClick={() => setManualOpen(true)}>
            <PlusCircle className="h-4 w-4" />
            Kod Ekle
          </Button>
          <Button onClick={() => setGenOpen(true)}>
            <Plus className="h-4 w-4" />
            Kod Üret
          </Button>
        </div>
      </div>

      {importMsg && (
        <div className="mb-4 rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-800">
          {importMsg}
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={KeyRound} label="Aktif" value={counts.active} tone="green" />
        <StatCard icon={CheckCircle2} label="Kullanıldı" value={counts.used} tone="blue" />
        <StatCard icon={Ban} label="Pasif" value={counts.passive} tone="gray" />
        <StatCard icon={Clock} label="Süresi Doldu" value={counts.expired} tone="red" />
      </div>

      <Card className="mb-4 p-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--color-muted)]">Durum:</span>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="max-w-xs"
          >
            <option value="">Tümü</option>
            <option value="active">Aktif</option>
            <option value="used">Kullanıldı</option>
            <option value="passive">Pasif</option>
            <option value="expired">Süresi Doldu</option>
          </Select>
          <Button variant="ghost" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-bg)] text-left text-xs uppercase text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3">Kod</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3">Kullanan</th>
                <th className="px-4 py-3">Son Kullanma</th>
                <th className="px-4 py-3">Oluşturma</th>
                <th className="px-4 py-3">Kullanım</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[var(--color-muted)]">
                    Kod bulunamadı.
                  </td>
                </tr>
              ) : (
                paged.map((c) => (
                  <tr key={c.id} className="hover:bg-[var(--color-bg)]">
                    <td className="px-4 py-3 font-mono">{c.code}</td>
                    <td className="px-4 py-3">
                      <CodeStatusBadge status={c.eff} />
                    </td>
                    <td className="px-4 py-3">{usedByName(c.registration) ?? '—'}</td>
                    <td className="px-4 py-3">{formatDate(c.expires_at)}</td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">
                      {formatDate(c.created_at)}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">
                      {formatDateTime(c.used_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(c.status === 'active' || c.status === 'passive') &&
                        (c.status === 'passive' ? (
                          <button
                            onClick={() => toggleStatus(c)}
                            title="Aktifleştir"
                            className="rounded-md p-1.5 text-[var(--color-muted)] hover:bg-green-50 hover:text-[var(--color-success)]"
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleStatus(c)}
                            title="Pasifleştir"
                            className="rounded-md p-1.5 text-[var(--color-muted)] hover:bg-amber-50 hover:text-amber-600"
                          >
                            <PowerOff className="h-4 w-4" />
                          </button>
                        ))}
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

      {genOpen && (
        <GenerateModal
          onClose={() => setGenOpen(false)}
          onDone={() => {
            setGenOpen(false)
            load()
          }}
        />
      )}

      {manualOpen && (
        <ManualAddModal
          onClose={() => setManualOpen(false)}
          onDone={() => {
            setManualOpen(false)
            load()
          }}
        />
      )}
    </div>
  )
}

function ManualAddModal({
  onClose,
  onDone,
}: {
  onClose: () => void
  onDone: () => void
}) {
  const [code, setCode] = useState('')
  const [expires, setExpires] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const errors: Record<string, string> = {
    invalid_code: 'Geçerli bir kod girin (en az 3 karakter).',
    exists: 'Bu kod zaten sistemde kayıtlı.',
  }

  async function submit() {
    setError(null)
    setLoading(true)
    const { data, error: rpcErr } = await callRpc('add_activation_code', {
      p_code: code,
      p_expires_at: expires ? new Date(expires).toISOString() : null,
    })
    setLoading(false)
    if (rpcErr) {
      setError('İşlem başarısız. Yetkinizi kontrol edin.')
      return
    }
    const r = data as { success: boolean; reason: string }
    if (r.success) {
      onDone()
    } else {
      setError(errors[r.reason] ?? 'Kod eklenemedi.')
    }
  }

  return (
    <Modal open onClose={onClose} title="Elle Kod Ekle">
      <label className="mb-1.5 block text-sm font-medium">Aktivasyon Kodu</label>
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="VT-XXXX-XXXX"
        autoFocus
        className="font-mono uppercase"
      />
      <label className="mb-1.5 mt-4 block text-sm font-medium">
        Son Kullanma Tarihi (opsiyonel)
      </label>
      <Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
      <p className="mt-1 text-xs text-[var(--color-muted)]">
        Kodun geçerlilik bitiş tarihi. Boş bırakılırsa süresiz olur.
      </p>
      {error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
      <Button className="mt-5 w-full" onClick={submit} disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Ekle
      </Button>
    </Modal>
  )
}

function statusLabel(s: CodeStatus): string {
  return { active: 'Aktif', used: 'Kullanıldı', passive: 'Pasif', expired: 'Süresi Doldu' }[s]
}

function GenerateModal({
  onClose,
  onDone,
}: {
  onClose: () => void
  onDone: () => void
}) {
  const [count, setCount] = useState(10)
  const [expires, setExpires] = useState('')
  const [label, setLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(downloadAfter: boolean) {
    setError(null)
    setLoading(true)
    const { data: batchId, error: rpcError } = await callRpc('generate_codes', {
      p_count: count,
      p_expires_at: expires ? new Date(expires).toISOString() : null,
      p_label: label || null,
    })
    if (rpcError) {
      setLoading(false)
      setError('Kod üretimi başarısız. Yetkinizi kontrol edin.')
      return
    }
    if (downloadAfter && batchId) {
      const { data: newCodes } = await supabase
        .from('activation_codes')
        .select('code, expires_at')
        .eq('batch_id', batchId as string)
        .order('code')
      type NewCode = { code: string; expires_at: string | null }
      await exportToExcel<NewCode>(
        'yeni-kodlar.xlsx',
        [
          { header: 'Kod', value: (r: NewCode) => r.code },
          {
            header: 'Son Kullanma',
            value: (r: NewCode) => formatDate(r.expires_at),
          },
        ],
        (newCodes as NewCode[]) ?? [],
      )
    }
    setLoading(false)
    onDone()
  }

  return (
    <Modal open onClose={onClose} title="Kod Üret">
      <label className="mb-1.5 block text-sm font-medium">Adet</label>
      <Input
        type="number"
        min={1}
        max={10000}
        value={count}
        onChange={(e) => setCount(Number(e.target.value))}
      />
      <label className="mb-1.5 mt-4 block text-sm font-medium">
        Son Kullanma Tarihi (opsiyonel)
      </label>
      <Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
      <label className="mb-1.5 mt-4 block text-sm font-medium">
        Parti Etiketi (opsiyonel)
      </label>
      <Input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Örn. Eylül Kampanyası"
      />
      {error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
      <div className="mt-5 flex gap-2">
        <Button className="flex-1" onClick={() => submit(true)} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Üret ve İndir
        </Button>
        <Button variant="outline" onClick={() => submit(false)} disabled={loading}>
          Sadece Üret
        </Button>
      </div>
    </Modal>
  )
}
