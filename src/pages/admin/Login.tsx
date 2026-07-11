import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ShieldCheck, Zap } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input, Field } from '@/components/ui/Input'
import BrandShell, { MosaicAccent, BrandCard } from '@/components/layout/BrandShell'

const DEMO_EMAIL = 'admin@vocatooki.test'
const DEMO_PASSWORD = 'Admin123!'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function doSignIn(mail: string, pass: string) {
    setError(null)
    setLoading(true)
    const res = await signIn(mail.trim(), pass)
    setLoading(false)
    if (!res.ok) {
      setError(
        res.reason === 'not_admin'
          ? 'Bu hesabın yönetim paneli yetkisi yok.'
          : 'E-posta veya şifre hatalı.',
      )
      return
    }
    navigate('/admin', { replace: true })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await doSignIn(email, password)
  }

  return (
    <BrandShell cornerLink={{ to: '/', label: 'Öğrenci kayıt sayfası' }}>
      <BrandCard>
        <MosaicAccent className="mb-6" />

        <h1 className="flex items-center gap-2 font-display text-[1.7rem] font-extrabold leading-tight tracking-tight text-[var(--color-brand-ink)]">
          <ShieldCheck className="h-6 w-6 text-[var(--color-brand-teal-strong)]" />
          Yönetim Paneli
        </h1>
        <p className="mt-2 text-sm text-[var(--color-brand-muted)]">
          Devam etmek için giriş yapın.
        </p>

        <form onSubmit={handleSubmit} className="mt-6">
          <Field label="E-posta">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </Field>
          <Field label="Şifre">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
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
            Giriş Yap
          </Button>
        </form>

        {import.meta.env.DEV && (
          <div className="mt-5 border-t border-[var(--color-brand-border)] pt-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-amber-600">
              <Zap className="h-3.5 w-3.5" />
              Geliştirme Hızlı Erişim
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
              disabled={loading}
              onClick={() => doSignIn(DEMO_EMAIL, DEMO_PASSWORD)}
            >
              Demo Admin ile Giriş
            </Button>
            <p className="mt-2 text-center text-[11px] text-[var(--color-brand-muted)]">
              {DEMO_EMAIL} · yalnızca geliştirme
            </p>
          </div>
        )}
      </BrandCard>
    </BrandShell>
  )
}
