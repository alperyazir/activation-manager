import { CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import AuthShell from '@/components/layout/AuthShell'

export default function Success() {
  return (
    <AuthShell icon={CheckCircle2} title="Kaydınız Tamamlandı">
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-[var(--color-muted)]">
            Kaydınız başarıyla oluşturuldu ve tamamlandı. Aktivasyon kodunuz
            kullanıldı. Teşekkür ederiz!
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
