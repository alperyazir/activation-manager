import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  ClipboardList,
  KeyRound,
  Settings,
  ScrollText,
  LogOut,
  GraduationCap,
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
  { to: '/admin/admins', label: 'Yöneticiler', icon: ShieldCheck },
  { to: '/admin/settings', label: 'Sınıf & Dil', icon: Settings },
  { to: '/admin/logs', label: 'İşlem Logları', icon: ScrollText },
]

export default function AdminLayout() {
  const { signOut, session } = useAuth()
  const navigate = useNavigate()
  const email = session?.user.email ?? ''
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen lg:flex">
      {/* Mobil backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-[var(--color-surface)] transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold leading-tight">Voca Tooki</div>
              <div className="text-xs text-[var(--color-muted)]">Yönetim</div>
            </div>
          </div>
          <button
            className="rounded-md p-1 text-[var(--color-muted)] hover:bg-[var(--color-bg)] lg:hidden"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-fg)] hover:bg-[var(--color-bg)]',
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

      {/* İçerik */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobil üst bar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-[var(--color-surface)] px-4 py-3 lg:hidden">
          <button
            className="rounded-md p-1.5 text-[var(--color-fg)] hover:bg-[var(--color-bg)]"
            onClick={() => setOpen(true)}
            aria-label="Menü"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold">Voca Tooki</span>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
