import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  ClipboardList,
  KeyRound,
  Settings,
  ScrollText,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

const nav = [
  { to: '/admin', end: true, label: 'Kayıtlar', icon: ClipboardList },
  { to: '/admin/codes', label: 'Aktivasyon Kodları', icon: KeyRound },
  // superOnly: yalnızca baş yönetici görebilir
  { to: '/admin/admins', label: 'Yöneticiler', icon: ShieldCheck, superOnly: true },
  { to: '/admin/settings', label: 'Sınıf & Dil', icon: Settings },
  { to: '/admin/logs', label: 'İşlem Logları', icon: ScrollText },
]

export default function AdminLayout() {
  const { signOut, session, isSuperAdmin } = useAuth()
  const navigate = useNavigate()
  const email = session?.user.email ?? ''
  const [open, setOpen] = useState(false)

  const visibleNav = nav.filter((item) => !item.superOnly || isSuperAdmin)

  async function handleSignOut() {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen">
      {/* Mobil backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — her boyutta sabit (ekranda daima görünür) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-[var(--color-surface)] transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Marka logosu — sidebar başlığı */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b px-5">
          <img
            src="/dream-education-logo.svg"
            alt="Dream Education"
            draggable={false}
            className="h-7 w-auto select-none"
          />
          {/* mobil kapatma butonu */}
          <button
            className="rounded-md p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-bg)] lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3 lg:pt-4">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[var(--color-primary)] text-white shadow-sm shadow-[var(--color-primary)]/20'
                    : 'text-[var(--color-fg)] hover:bg-[var(--color-surface-2)]',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t p-3">
          {email && (
            <div className="mb-2 flex items-center gap-2 px-3 py-1.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-semibold text-white">
                {email[0]?.toUpperCase()}
              </span>
              <span
                className="min-w-0 truncate text-xs text-[var(--color-muted)]"
                title={email}
              >
                {email}
              </span>
            </div>
          )}
          <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </Button>
        </div>
      </aside>

      {/* İçerik — sabit sidebar için sol boşluk */}
      <div className="flex min-h-screen flex-col lg:ml-64">
        {/* Mobil üst bar */}
        <header className="sticky top-0 z-20 flex items-center border-b bg-[var(--color-surface)] px-4 py-3 lg:hidden">
          <button
            className="rounded-md p-1.5 text-[var(--color-fg)] hover:bg-[var(--color-bg)]"
            onClick={() => setOpen(true)}
            aria-label="Menü"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
