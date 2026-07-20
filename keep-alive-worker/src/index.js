// Supabase'e gerçek bir DB sorgusu atar (salt ping değil → DB aktivitesi sayılır).
async function pingSupabase(env) {
  const url = `${env.SUPABASE_URL}/rest/v1/sections?select=id&limit=1`
  const res = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
    },
  })
  return res
}

export default {
  // Cron ile günlük çalışır
  async scheduled(_event, env, _ctx) {
    const res = await pingSupabase(env)
    if (!res.ok) {
      console.error(`Keep-alive başarısız: HTTP ${res.status}`)
      throw new Error(`Supabase keep-alive returned ${res.status}`)
    }
    console.log('Keep-alive başarılı: Supabase aktif tutuldu.')
  },

  // Worker URL'sine girip elle test etmek için (opsiyonel)
  async fetch(_request, env) {
    const res = await pingSupabase(env)
    return new Response(
      res.ok ? 'OK: Supabase aktif tutuldu.' : `HATA: HTTP ${res.status}`,
      { status: res.ok ? 200 : 502 },
    )
  },
}
