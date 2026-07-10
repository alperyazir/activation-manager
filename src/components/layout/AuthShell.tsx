import type { LucideIcon } from 'lucide-react'

// Üstte teal hero şeridi (ikon + başlık) + şeride binen ortalanmış kart
export default function AuthShell({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* teal şerit */}
      <div
        className="relative overflow-hidden px-4 pb-24 pt-16 text-center text-white"
        style={{
          background: 'linear-gradient(150deg, #0a5b60 0%, #0d888e 48%, #12a8a5 100%)',
        }}
      >
        {/* logo motifini yankılayan yuvarlak-kutucuk şekilleri */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rotate-12 rounded-[2.5rem] bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-52 w-52 -rotate-6 rounded-[3rem] bg-white/[0.07]" />
        <div className="pointer-events-none absolute right-1/4 top-6 h-16 w-16 rotate-6 rounded-2xl bg-white/[0.06]" />

        <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
          <Icon className="h-7 w-7" />
        </div>
        <h1 className="relative mt-4 text-2xl font-extrabold tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="relative mx-auto mt-1 max-w-sm text-sm text-white/80">
            {subtitle}
          </p>
        )}
      </div>

      {/* içerik — şeride binen kart (z-10 ile şeridin üstünde) */}
      <div className="relative z-10 mx-auto -mt-12 w-full max-w-md px-4 pb-12">
        {children}
      </div>
    </div>
  )
}
