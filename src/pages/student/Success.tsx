import { CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import AuthShell from '@/components/layout/AuthShell'

export default function Success() {
  return (
    <AuthShell>
      <Card>
        <CardContent className="py-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-[var(--color-success)]">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="text-xl font-bold">Kaydınız Tamamlandı</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Kaydınız başarıyla oluşturuldu ve tamamlandı. Aktivasyon kodunuz
            kullanıldı. Teşekkür ederiz!
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
