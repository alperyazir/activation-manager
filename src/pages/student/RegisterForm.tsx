import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { supabase, callRpc } from '@/lib/supabase'
import { codeMessage } from '@/lib/messages'
import type { Grade, Language, Section } from '@/lib/database.types'
import { Button } from '@/components/ui/Button'
import { Input, Select, Field } from '@/components/ui/Input'
import BrandShell, { MosaicAccent, BrandCard } from '@/components/layout/BrandShell'

export default function RegisterForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const code = (location.state as { code?: string } | null)?.code

  const [grades, setGrades] = useState<Grade[]>([])
  const [languages, setLanguages] = useState<Language[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    grade_id: '',
    section_id: '',
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
      const [{ data: g }, { data: l }, { data: s }] = await Promise.all([
        supabase.from('grades').select('*').eq('active', true).order('sort_order'),
        supabase.from('languages').select('*').eq('active', true).order('sort_order'),
        supabase.from('sections').select('*').eq('active', true).order('sort_order'),
      ])
      setGrades(g ?? [])
      setLanguages(l ?? [])
      setSections(s ?? [])
    })()
  }, [code, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('Lütfen ad ve soyad girin.')
      return
    }
    if (!form.grade_id || !form.section_id || !form.language_id) {
      setError('Lütfen sınıf, şube ve dil seçin.')
      return
    }
    setLoading(true)
    const { data, error: rpcError } = await callRpc('redeem_code', {
      p_code: code!,
      p_first_name: form.first_name,
      p_last_name: form.last_name,
      p_grade_id: form.grade_id,
      p_language_id: form.language_id,
      p_section_id: form.section_id,
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
    <BrandShell>
      <BrandCard>
        <MosaicAccent className="mb-6" />

        <h1 className="font-display text-[1.7rem] font-extrabold leading-tight tracking-tight text-[var(--color-brand-ink)]">
          Bilgilerinizi girin
        </h1>
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-brand-teal-strong)]">
          <CheckCircle2 className="h-4 w-4" />
          Kodunuz doğrulandı
        </p>

        <form onSubmit={handleSubmit} className="mt-6">
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
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
          </div>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
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
            <Field label="Şube">
              <Select
                value={form.section_id}
                onChange={(e) => setForm({ ...form, section_id: e.target.value })}
              >
                <option value="">Seçiniz…</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
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
            <p
              role="alert"
              className="mb-4 rounded-lg bg-[color-mix(in_srgb,var(--color-brand-coral)_12%,white)] px-3 py-2 text-sm font-medium text-[var(--color-brand-ink)]"
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="brand"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Kaydı tamamla
          </Button>
        </form>
      </BrandCard>
    </BrandShell>
  )
}
