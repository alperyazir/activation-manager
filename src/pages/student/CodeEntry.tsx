import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Loader2 } from 'lucide-react'
import { callRpc } from '@/lib/supabase'
import { codeMessage } from '@/lib/messages'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import AuthShell from '@/components/layout/AuthShell'

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
    <AuthShell
      icon={KeyRound}
      title="Öğrenci kaydına hoş geldiniz"
      subtitle="Kaydınıza başlamak için aktivasyon kodunuzu girin"
    >
      <Card>
        <CardContent className="py-6">
          <form onSubmit={handleSubmit}>
            <label className="mb-1.5 block text-sm font-medium">
              Aktivasyon Kodu
            </label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="VT-XXXX-XXXX"
              autoFocus
              autoComplete="off"
              className="text-center font-mono text-lg tracking-widest uppercase"
            />
            {error && (
              <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" className="mt-5 w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Devam Et
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-[var(--color-muted)]">
        Her aktivasyon kodu yalnızca bir kez kullanılabilir.
      </p>
    </AuthShell>
  )
}
