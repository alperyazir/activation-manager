import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  CalendarRange,
  Download,
  Loader2,
  RefreshCw,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { supabase, callRpc } from '@/lib/supabase'
import type { Grade, Language } from '@/lib/database.types'
import { formatDateTime } from '@/lib/utils'
import { exportToExcel } from '@/lib/excel'
import { usePagination } from '@/lib/usePagination'
import { Button } from '@/components/ui/Button'
import { Input, Select, FilterLabel } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'

interface RegRow {
  id: string
  first_name: string
  last_name: string
  registered_at: string
  grade: { name: string } | null
  language: { name: string } | null
  code: { code: string } | null
}

export default function Registrations() {
  const [rows, setRows] = useState<RegRow[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [languages, setLanguages] = useState<Language[]>([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [grade, setGrade] = useState('')
  const [language, setLanguage] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [delTarget, setDelTarget] = useState<RegRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('student_registrations')
      .select(
        `id, first_name, last_name, registered_at,
         grade:grades(name), language:languages(name), code:activation_codes(code)`,
      )
      .order('registered_at', { ascending: false })
      .order('id', { ascending: false })
    setRows((data as unknown as RegRow[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase
      .from('grades')
      .select('*')
      .order('sort_order')
      .then(({ data }) => setGrades(data ?? []))
    supabase
      .from('languages')
      .select('*')
      .order('sort_order')
      .then(({ data }) => setLanguages(data ?? []))
    load()
  }, [load])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const full = `${r.first_name} ${r.last_name}`.toLocaleLowerCase('tr')
      if (name && !full.includes(name.toLocaleLowerCase('tr'))) return false
      if (grade && r.grade?.name !== grade) return false
      if (language && r.language?.name !== language) return false
      // Her iki sınır da yerel saatle (from: gün başı, to: gün sonu)
      if (from && new Date(r.registered_at) < new Date(from + 'T00:00:00')) return false
      if (to && new Date(r.registered_at) > new Date(to + 'T23:59:59')) return false
      return true
    })
  }, [rows, name, grade, language, from, to])

  const stats = useMemo(() => {
    const now = new Date()
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(startToday)
    weekAgo.setDate(weekAgo.getDate() - 6)
    const today = rows.filter((r) => new Date(r.registered_at) >= startToday).length
    const last7 = rows.filter((r) => new Date(r.registered_at) >= weekAgo).length
    return { total: rows.length, today, last7 }
  }, [rows])

  const { page, setPage, pageCount, pageSize, total, paged } = usePagination(
    filtered,
    15,
    `${name}|${grade}|${language}|${from}|${to}`,
  )

  const hasFilters = !!(name || grade || language || from || to)
  function clearFilters() {
    setName('')
    setGrade('')
    setLanguage('')
    setFrom('')
    setTo('')
  }

  async function handleDelete() {
    if (!delTarget) return
    setDeleting(true)
    await callRpc('delete_registration', { p_id: delTarget.id })
    setDeleting(false)
    setDelTarget(null)
    load()
  }

  async function handleExport() {
    await exportToExcel(
      'kayitlar.xlsx',
      [
        { header: 'Ad', value: (r: RegRow) => r.first_name },
        { header: 'Soyad', value: (r: RegRow) => r.last_name },
        { header: 'Sınıf', value: (r: RegRow) => r.grade?.name ?? '' },
        { header: 'Dil', value: (r: RegRow) => r.language?.name ?? '' },
        { header: 'Kod', value: (r: RegRow) => r.code?.code ?? '' },
        {
          header: 'Kayıt Tarihi',
          value: (r: RegRow) => formatDateTime(r.registered_at),
        },
      ],
      filtered,
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Öğrenci Kayıtları</h1>
          <p className="text-sm text-[var(--color-muted)]">
            {filtered.length} kayıt gösteriliyor
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}>
            <RefreshCw className="h-4 w-4" />
            Yenile
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Excel'e Aktar</span>
            <span className="sm:hidden">Excel</span>
          </Button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={Users} label="Toplam Kayıt" value={stats.total} tone="blue" />
        <StatCard icon={CalendarDays} label="Bugün" value={stats.today} tone="green" />
        <StatCard icon={CalendarRange} label="Son 7 Gün" value={stats.last7} tone="amber" />
      </div>

      <Card className="mb-4 p-4">
        <div className="grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div>
            <FilterLabel>Ad Soyad</FilterLabel>
            <Input
              placeholder="Ad soyad ara…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <FilterLabel>Sınıf</FilterLabel>
            <Select value={grade} onChange={(e) => setGrade(e.target.value)}>
              <option value="">Tüm sınıflar</option>
              {grades.map((g) => (
                <option key={g.id} value={g.name}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FilterLabel>Dil</FilterLabel>
            <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="">Tüm diller</option>
              {languages.map((l) => (
                <option key={l.id} value={l.name}>
                  {l.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FilterLabel>Başlangıç Tarihi</FilterLabel>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <FilterLabel>Bitiş Tarihi</FilterLabel>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          {hasFilters && (
            <div className="flex items-end">
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-[var(--color-muted)]"
              >
                <X className="h-4 w-4" />
                Filtreleri Temizle
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-bg)] text-left text-xs uppercase text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3">Ad Soyad</th>
                <th className="px-4 py-3">Sınıf</th>
                <th className="px-4 py-3">Dil</th>
                <th className="px-4 py-3">Kod</th>
                <th className="px-4 py-3">Kayıt Tarihi</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[var(--color-muted)]">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[var(--color-muted)]">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              ) : (
                paged.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--color-bg)]">
                    <td className="px-4 py-3 font-medium">
                      {r.first_name} {r.last_name}
                    </td>
                    <td className="px-4 py-3">{r.grade?.name ?? '—'}</td>
                    <td className="px-4 py-3">{r.language?.name ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.code?.code ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">
                      {formatDateTime(r.registered_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setDelTarget(r)}
                        title="Kaydı sil (KVKK)"
                        className="rounded-md p-1.5 text-[var(--color-muted)] hover:bg-red-50 hover:text-[var(--color-danger)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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

      {delTarget && (
        <Modal open onClose={() => setDelTarget(null)} title="Kaydı Sil">
          <p className="text-sm text-[var(--color-fg)]">
            <span className="font-semibold">
              {delTarget.first_name} {delTarget.last_name}
            </span>{' '}
            adlı öğrencinin kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz.
          </p>
          <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            KVKK kapsamında kişisel veriler silinir. Kullanılan aktivasyon kodu
            (<span className="font-mono">{delTarget.code?.code}</span>) “Kullanıldı”
            olarak kalır.
          </p>
          <div className="mt-5 flex gap-2">
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Kalıcı Olarak Sil
            </Button>
            <Button variant="outline" onClick={() => setDelTarget(null)}>
              Vazgeç
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
