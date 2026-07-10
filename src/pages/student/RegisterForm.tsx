import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Loader2, UserPlus } from 'lucide-react'
import { supabase, callRpc } from '@/lib/supabase'
import { codeMessage } from '@/lib/messages'
import type { Grade, Language } from '@/lib/database.types'
import { Button } from '@/components/ui/Button'
import { Input, Select, Field } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import AuthShell from '@/components/layout/AuthShell'

export default function RegisterForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const code = (location.state as { code?: string } | null)?.code

  const [grades, setGrades] = useState<Grade[]>([])
  const [languages, setLanguages] = useState<Language[]>([])
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    grade_id: '',
    language_id: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!code) {
      navigate('/', { replace: true })
      return
    }
    ;(async () => {
      const [{ data: g }, { data: l }] = await Promise.all([
        supabase.from('grades').select('*').eq('active', true).order('sort_order'),
        supabase.from('languages').select('*').eq('active', true).order('sort_order'),
      ])
      setGrades(g ?? [])
      setLanguages(l ?? [])
    })()
  }, [code, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('Lütfen ad ve soyad girin.')
      return
    }
    if (!form.grade_id || !form.language_id) {
      setError('Lütfen sınıf ve dil seçin.')
      return
    }
    setLoading(true)
    const { data, error: rpcError } = await callRpc('redeem_code', {
      p_code: code!,
      p_first_name: form.first_name,
      p_last_name: form.last_name,
      p_grade_id: form.grade_id,
      p_language_id: form.language_id,
    })
    setLoading(false)

    if (rpcError) {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.')
      return
    }
    const result = data as { success: boolean; reason: string }
    if (result.success) {
      navigate('/success', { replace: true })
    } else {
      setError(codeMessage(result.reason))
    }
  }

  return (
    <AuthShell>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white shadow-lg shadow-blue-500/20">
          <UserPlus className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold">Öğrenci Bilgi Formu</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Kod doğrulandı. Lütfen bilgilerinizi girin.
        </p>
      </div>

      <Card>
          <CardHeader>
            <CardTitle>Bilgiler</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Field label="Ad">
                <Input
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  autoFocus
                />
              </Field>
              <Field label="Soyad">
                <Input
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                />
              </Field>
              <Field label="Sınıf">
                <Select
                  value={form.grade_id}
                  onChange={(e) => setForm({ ...form, grade_id: e.target.value })}
                >
                  <option value="">Seçiniz…</option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Dil">
                <Select
                  value={form.language_id}
                  onChange={(e) => setForm({ ...form, language_id: e.target.value })}
                >
                  <option value="">Seçiniz…</option>
                  {languages.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </Select>
              </Field>

              {error && (
                <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Kaydı Tamamla
              </Button>
            </form>
          </CardContent>
        </Card>
    </AuthShell>
  )
}
