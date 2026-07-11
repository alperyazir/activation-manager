import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, ShieldCheck } from 'lucide-react'
import { supabase, callRpc } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Field } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'

interface AdminRow {
  user_id: string
  full_name: string
  email: string
  active: boolean
  super_admin: boolean
  created_at: string
}

const createErrors: Record<string, string> = {
  invalid_email: 'Geçerli bir e-posta girin.',
  weak_password: 'Şifre en az 8 karakter olmalıdır.',
  invalid_name: 'Ad soyad en az 2 karakter olmalıdır.',
  email_taken: 'Bu e-posta zaten kayıtlı.',
  forbidden: 'Bu işlem için yetkiniz yok.',
  unauthorized: 'Oturum geçersiz. Tekrar giriş yapın.',
}

export default function Admins() {
  const { session } = useAuth()
  const myId = session?.user.id
  const [rows, setRows] = useState<AdminRow[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await callRpc('list_admins', {})
    setRows((data as AdminRow[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function toggleActive(a: AdminRow) {
    await callRpc('set_admin_active', { p_user_id: a.user_id, p_active: !a.active })
    load()
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Yöneticiler</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Panele erişebilen yetkili kullanıcılar
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Yönetici Ekle
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-bg)] text-left text-xs uppercase text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3">Ad Soyad</th>
                <th className="px-4 py-3">E-posta</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3">Eklenme</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : (
                rows.map((a) => (
                  <tr key={a.user_id} className="hover:bg-[var(--color-bg)]">
                    <td className="px-4 py-3 font-medium">
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-[var(--color-primary)]" />
                        {a.full_name}
                        {a.super_admin && (
                          <span className="rounded bg-[var(--color-primary)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-primary)]">
                            Baş Yönetici
                          </span>
                        )}
                        {a.user_id === myId && (
                          <span className="rounded bg-[var(--color-bg)] px-1.5 py-0.5 text-[10px] text-[var(--color-muted)]">
                            siz
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">{a.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          a.active
                            ? 'inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                            : 'inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600 ring-1 ring-inset ring-gray-500/20'
                        }
                      >
                        {a.active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">
                      {formatDate(a.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.user_id !== myId && !a.super_admin && (
                        <Button size="sm" variant="ghost" onClick={() => toggleActive(a)}>
                          {a.active ? 'Pasifleştir' : 'Aktifleştir'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {open && (
        <AddAdminModal
          onClose={() => setOpen(false)}
          onDone={() => {
            setOpen(false)
            load()
          }}
        />
      )}
    </div>
  )
}

function AddAdminModal({
  onClose,
  onDone,
}: {
  onClose: () => void
  onDone: () => void
}) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit() {
    setError(null)
    setLoading(true)
    const { error: fnError } = await supabase.functions.invoke('create-admin', {
      body: { email, password, full_name: fullName },
    })
    setLoading(false)
    if (fnError) {
      let code = ''
      try {
        // FunctionsHttpError: gövdeyi oku
        const ctx = (fnError as { context?: Response }).context
        if (ctx) code = (await ctx.json())?.error ?? ''
      } catch {
        /* yoksay */
      }
      setError(createErrors[code] ?? 'Yönetici oluşturulamadı.')
      return
    }
    onDone()
  }

  return (
    <Modal open onClose={onClose} title="Yönetici Ekle">
      <Field label="Ad Soyad">
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
      </Field>
      <Field label="E-posta">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="off"
        />
      </Field>
      <Field label="Şifre">
        <Input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="En az 8 karakter"
          autoComplete="off"
          className="font-mono"
        />
      </Field>
      {error && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
      <Button className="w-full" onClick={submit} disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Oluştur
      </Button>
    </Modal>
  )
}
