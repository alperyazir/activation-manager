import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

// Dream Education marka çerçevesi — öğrenci aktivasyon akışı VE yönetim paneli girişi ortak kullanır.
// Sade düzen: logo sol üstte, kart ekranın ortasında, küçük köşe linki sol altta.
// (Giriş sonrası admin paneli — sidebar vb. — ayrı teal temada kalır.)

// DreamEducation mozaiğini yankılayan ince renkli aksan — kartın üst kenarında.
export function MosaicAccent({ className = '' }: { className?: string }) {
  const tiles = [
    'var(--color-brand-coral)',
    'var(--color-brand-gold)',
    'var(--color-brand-teal)',
    'var(--color-brand-coral)',
    'var(--color-brand-gold)',
  ]
  return (
    <div className={`flex items-center gap-1.5 ${className}`} aria-hidden>
      {tiles.map((c, i) => (
        <span
          key={i}
          className="h-2.5 rounded-[3px]"
          style={{
            backgroundColor: c,
            width: i === 0 ? '1.75rem' : i === 2 ? '1.25rem' : '0.625rem',
          }}
        />
      ))}
    </div>
  )
}

// Kart kabuğu — beyaz, üstte mozaik aksan, marka gölgesi. İsteğe bağlı alt not.
export function BrandCard({
  children,
  note,
  contentClassName,
}: {
  children: React.ReactNode
  note?: React.ReactNode
  contentClassName?: string
}) {
  return (
    <div className="rise-in overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-brand-border)] bg-white shadow-[0_1px_2px_rgba(87,0,38,0.04),0_18px_40px_-24px_rgba(87,0,38,0.25)]">
      <div className={cn('px-7 pb-8 pt-7 sm:px-9', contentClassName)}>
        {children}
      </div>
      {note && (
        <p className="border-t border-[var(--color-brand-border)] bg-[var(--color-brand-surface-2)] px-7 py-3.5 text-center text-xs text-[var(--color-brand-muted)] sm:px-9">
          {note}
        </p>
      )}
    </div>
  )
}

export default function BrandShell({
  children,
  cornerLink = { to: '/admin/login', label: 'Yönetici girişi' },
}: {
  children: React.ReactNode
  cornerLink?: { to: string; label: string } | null
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-brand-bg)]">
      {/* çok hafif atmosfer */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-4rem] top-[-3rem] h-64 w-64 rotate-12 rounded-[3.5rem] opacity-[0.05]"
        style={{ backgroundColor: 'var(--color-brand-teal)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-4rem] left-[-4rem] h-72 w-72 -rotate-6 rounded-[4rem] opacity-[0.04]"
        style={{ backgroundColor: 'var(--color-brand-coral)' }}
      />

      {/* Logo — sol üst köşe */}
      <img
        src="/dream-education-logo.svg"
        alt="Dream Education"
        draggable={false}
        className="absolute left-6 top-6 z-10 h-8 w-auto select-none sm:left-10 sm:top-8 sm:h-9"
      />

      {/* Kart — ekranın ortasında */}
      <div className="flex min-h-screen items-center justify-center px-6 py-28">
        <div className="w-full max-w-md">{children}</div>
      </div>

      {/* Küçük köşe linki — sol alt */}
      {cornerLink && (
        <Link
          to={cornerLink.to}
          className="absolute bottom-5 left-6 z-10 text-xs text-[var(--color-brand-muted)] underline-offset-2 transition-colors hover:text-[var(--color-brand-ink)] hover:underline sm:left-10"
        >
          {cornerLink.label}
        </Link>
      )}
    </div>
  )
}
