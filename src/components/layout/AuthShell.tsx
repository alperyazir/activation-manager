// Ortalanmış tek sütunlu kabuk (öğrenci giriş/kayıt/başarılı + admin login)
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-10">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
