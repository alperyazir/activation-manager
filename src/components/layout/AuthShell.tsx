import { ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react'

const features = [
  {
    icon: KeyRound,
    title: 'Tek kullanımlık kod',
    desc: 'Her aktivasyon kodu yalnızca bir kez kullanılır.',
  },
  {
    icon: CheckCircle2,
    title: 'Hızlı kayıt',
    desc: 'Birkaç adımda öğrenci kaydını tamamlayın.',
  },
  {
    icon: ShieldCheck,
    title: 'KVKK uyumlu',
    desc: 'Öğrenci verileri güvenli şekilde korunur.',
  },
]

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Sol marka paneli — mobilde gizli */}
      <div className="relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        {/* teal degrade zemin */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(150deg, #0a5b60 0%, #0d888e 48%, #12a8a5 100%)',
          }}
        />
        {/* logo motifini yankılayan yumuşak yuvarlak-kutucuk şekilleri */}
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rotate-12 rounded-[2.5rem] bg-white/10" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-80 w-80 -rotate-6 rounded-[3rem] bg-white/[0.07]" />
        <div className="pointer-events-none absolute right-24 bottom-28 h-24 w-24 rotate-6 rounded-3xl bg-white/[0.06]" />

        <div className="relative">
          <h2 className="max-w-sm text-[2rem] font-extrabold leading-[1.15] xl:text-[2.5rem]">
            Öğrenci kaydına hoş geldiniz
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">
            Aktivasyon kodunuzla hızlı, güvenli ve KVKK uyumlu bir şekilde kaydolun.
          </p>

          <ul className="mt-10 space-y-4">
            {features.map((f) => (
              <li key={f.title} className="flex items-start gap-3.5">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
                  <f.icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-sm font-semibold">{f.title}</div>
                  <div className="text-xs text-white/65">{f.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-white/55">
          © {new Date().getFullYear()} DreamEdTech
        </div>
      </div>

      {/* Sağ içerik */}
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-10 lg:min-h-0">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
