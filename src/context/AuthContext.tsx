import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type SignInResult = { ok: true } | { ok: false; reason: 'auth' | 'not_admin' }

interface AuthState {
  session: Session | null
  isAdmin: boolean
  isSuperAdmin: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<SignInResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

type AdminCheck = { isAdmin: boolean; isSuperAdmin: boolean }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  async function checkAdmin(userId: string): Promise<AdminCheck> {
    const { data } = await supabase
      .from('admins')
      .select('user_id, super_admin')
      .eq('user_id', userId)
      .eq('active', true)
      .maybeSingle<{ user_id: string; super_admin: boolean }>()
    return { isAdmin: !!data, isSuperAdmin: !!data?.super_admin }
  }

  async function refreshAdmin(s: Session | null) {
    const check = s ? await checkAdmin(s.user.id) : { isAdmin: false, isSuperAdmin: false }
    setIsAdmin(check.isAdmin)
    setIsSuperAdmin(check.isSuperAdmin)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      await refreshAdmin(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s)
      await refreshAdmin(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string): Promise<SignInResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error || !data.session) return { ok: false, reason: 'auth' }

    // Admin yetkisini giriş anında, yönlendirmeden ÖNCE doğrula ve state'i
    // senkron ayarla — aksi halde ProtectedRoute isAdmin=false görüp
    // kullanıcıyı login'e geri atıyordu ("iki kez giriş" bug'ı).
    const admin = await checkAdmin(data.user.id)
    if (!admin.isAdmin) {
      await supabase.auth.signOut()
      return { ok: false, reason: 'not_admin' }
    }
    setSession(data.session)
    setIsAdmin(true)
    setIsSuperAdmin(admin.isSuperAdmin)
    return { ok: true }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{ session, isAdmin, isSuperAdmin, loading, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
