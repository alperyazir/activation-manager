import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ShieldCheck, Zap } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input, Field } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import AuthShell from '@/components/layout/AuthShell'

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
    <AuthShell>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-fg)] text-white shadow-lg">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold">Yönetim Paneli</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Devam etmek için giriş yapın
        </p>
      </div>
      <Card>
          <CardContent className="py-6">
            <form onSubmit={handleSubmit}>
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
                <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Giriş Yap
              </Button>
            </form>

            {import.meta.env.DEV && (
              <div className="mt-5 border-t pt-4">
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
                <p className="mt-2 text-center text-[11px] text-[var(--color-muted)]">
                  {DEMO_EMAIL} · yalnızca geliştirme
                </p>
              </div>
            )}
          </CardContent>
      </Card>
    </AuthShell>
  )
}
