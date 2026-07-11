import { Check } from 'lucide-react'
import BrandShell, { MosaicAccent, BrandCard } from '@/components/layout/BrandShell'

export default function Success() {
  return (
    <BrandShell>
      <BrandCard contentClassName="pb-9 text-center">
        <MosaicAccent className="mb-8 justify-center" />

        <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
          <span
            className="absolute inset-0 rounded-full"
            style={{
              backgroundColor:
                'color-mix(in srgb, var(--color-brand-teal) 16%, white)',
            }}
          />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-teal-strong)] text-white shadow-sm">
            <Check className="h-7 w-7" strokeWidth={3} />
          </span>
        </div>

        <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight text-[var(--color-brand-ink)]">
          Kaydınız tamamlandı
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-[var(--color-brand-muted)]">
          Kaydınız başarıyla oluşturuldu ve aktivasyon kodunuz kullanıldı.
          Teşekkür ederiz!
        </p>
      </BrandCard>
    </BrandShell>
  )
}
