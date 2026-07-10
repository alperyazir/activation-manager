import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anonKey) {
  // Fail loud in dev so misconfiguration is obvious.
  console.error(
    'Supabase env eksik. .env.local içine VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY ekleyin.',
  )
}

export const supabase = createClient<Database>(url ?? '', anonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Tipli RPC yardımcısı: supabase-js jenerik Functions çıkarımı sürüm bağımlı
// olduğundan, argüman ve dönüş tiplerini kendi şema tipimizden veriyoruz.
type Fns = Database['public']['Functions']

export async function callRpc<K extends keyof Fns>(
  fn: K,
  args: Fns[K]['Args'],
): Promise<{ data: Fns[K]['Returns'] | null; error: { message: string } | null }> {
  const rpc = supabase.rpc as unknown as (
    name: string,
    params: unknown,
  ) => Promise<{ data: unknown; error: { message: string } | null }>
  // .call(supabase, ...) ile `this` bağlamasını koru; aksi halde supabase-js
  // içeride this.rest'e erişemez ve "reading 'rest'" hatası verir.
  const { data, error } = await rpc.call(supabase, fn as string, args)
  return { data: data as Fns[K]['Returns'] | null, error }
}
