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
  loading: boolean
  signIn: (email: string, password: string) => Promise<SignInResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  async function checkAdmin(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', userId)
      .eq('active', true)
      .maybeSingle()
    return !!data
  }

  async function refreshAdmin(s: Session | null) {
    setIsAdmin(s ? await checkAdmin(s.user.id) : false)
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
    if (!admin) {
      await supabase.auth.signOut()
      return { ok: false, reason: 'not_admin' }
    }
    setSession(data.session)
    setIsAdmin(true)
    return { ok: true }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, isAdmin, loading, signIn, signOut }}>
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
