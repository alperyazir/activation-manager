import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2 } from 'lucide-react'
import { callRpc } from '@/lib/supabase'
import { codeMessage } from '@/lib/messages'
import { Button } from '@/components/ui/Button'
import BrandShell, { MosaicAccent, BrandCard } from '@/components/layout/BrandShell'

export default function CodeEntry() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!code.trim()) {
      setError('Lütfen aktivasyon kodunuzu girin.')
      return
    }
    setLoading(true)
    const { data, error: rpcError } = await callRpc('check_code', {
      p_code: code,
    })
    setLoading(false)

    if (rpcError) {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.')
      return
    }
    const result = data as { valid: boolean; reason: string }
    if (result.valid) {
      navigate('/register', { state: { code: code.trim() } })
    } else {
      setError(codeMessage(result.reason))
    }
  }

  return (
    <BrandShell>
      <BrandCard note="Her aktivasyon kodu yalnızca bir kez kullanılabilir.">
        <MosaicAccent className="mb-6" />

        <h1 className="font-display text-[1.7rem] font-extrabold leading-tight tracking-tight text-[var(--color-brand-ink)]">
          Hoş geldiniz
        </h1>
        <p className="mt-2 text-sm text-[var(--color-brand-muted)]">
          Kaydınıza başlamak için aktivasyon kodunuzu girin.
        </p>

        <form onSubmit={handleSubmit} className="mt-7">
          <label
            htmlFor="code"
            className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-muted)]"
          >
            Aktivasyon Kodu
          </label>
          <input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="VT-XXXX-XXXX"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            inputMode="text"
            className="h-14 w-full rounded-xl border-2 border-[var(--color-brand-border)] bg-[var(--color-brand-surface-2)] text-center font-mono text-xl font-semibold uppercase tracking-[0.28em] text-[var(--color-brand-ink)] placeholder:font-normal placeholder:tracking-[0.2em] placeholder:text-[color-mix(in_srgb,var(--color-brand-muted)_55%,transparent)] transition-colors focus-visible:border-[var(--color-brand-teal)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--color-brand-teal)_28%,transparent)]"
          />

          {error && (
            <p
              role="alert"
              className="mt-3 rounded-lg bg-[color-mix(in_srgb,var(--color-brand-coral)_12%,white)] px-3 py-2 text-sm font-medium text-[var(--color-brand-ink)]"
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="brand"
            size="lg"
            className="mt-5 w-full"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            Devam et
          </Button>
        </form>
      </BrandCard>
    </BrandShell>
  )
}
