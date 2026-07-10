import { GraduationCap, ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react'

const features = [
  { icon: KeyRound, title: 'Tek kullanımlık kod', desc: 'Her aktivasyon kodu yalnızca bir kez kullanılır.' },
  { icon: CheckCircle2, title: 'Hızlı kayıt', desc: 'Birkaç adımda öğrenci kaydını tamamlayın.' },
  { icon: ShieldCheck, title: 'KVKK uyumlu', desc: 'Öğrenci verileri güvenli şekilde korunur.' },
]

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Sol marka paneli — mobilde gizli */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#1e40af] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        {/* dekoratif şekiller */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="text-lg font-bold">Voca Tooki</span>
        </div>

        <div className="relative">
          <h2 className="max-w-sm text-3xl font-bold leading-tight xl:text-4xl">
            Öğrenci kaydına hoş geldiniz
          </h2>
          <p className="mt-3 max-w-sm text-sm text-white/80">
            Aktivasyon kodunuzla hızlı, güvenli ve KVKK uyumlu bir şekilde kaydolun.
          </p>

          <ul className="mt-10 space-y-5">
            {features.map((f) => (
              <li key={f.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                  <f.icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-sm font-semibold">{f.title}</div>
                  <div className="text-xs text-white/70">{f.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-white/60">
          © {new Date().getFullYear()} Voca Tooki
        </div>
      </div>

      {/* Sağ içerik */}
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-10 lg:min-h-0">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
