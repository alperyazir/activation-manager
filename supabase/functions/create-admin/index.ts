// Edge Function: create-admin
// Yeni bir yönetici (admin) oluşturur. Auth kullanıcısı service_role ile
// açılır, ardından public.admins tablosuna eklenir ve işlem loglanır.
// Yalnızca mevcut bir admin çağırabilir (JWT + is_admin() kontrolü).

import { createClient } from 'jsr:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const authHeader = req.headers.get('Authorization') ?? ''

  // 1) Çağıranı doğrula ve admin mi kontrol et
  const caller = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData } = await caller.auth.getUser()
  if (!userData?.user) return json({ error: 'unauthorized' }, 401)

  const { data: isAdmin, error: adminErr } = await caller.rpc('is_admin')
  if (adminErr || !isAdmin) return json({ error: 'forbidden' }, 403)

  // 2) Girdi doğrulama
  let body: { email?: string; password?: string; full_name?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_body' }, 400)
  }
  const email = (body.email ?? '').trim().toLowerCase()
  const password = body.password ?? ''
  const full_name = (body.full_name ?? '').trim()

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return json({ error: 'invalid_email' }, 400)
  if (password.length < 8) return json({ error: 'weak_password' }, 400)
  if (full_name.length < 2) return json({ error: 'invalid_name' }, 400)

  // 3) service_role ile auth kullanıcısı oluştur
  const admin = createClient(url, service)
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  })
  if (createErr || !created?.user) {
    const msg = createErr?.message ?? 'create_failed'
    const code = /already/i.test(msg) ? 'email_taken' : 'create_failed'
    return json({ error: code, detail: msg }, 400)
  }

  // 4) admins tablosuna ekle
  const { error: insErr } = await admin
    .from('admins')
    .insert({ user_id: created.user.id, full_name })
  if (insErr) {
    // temizlik: auth kullanıcısını geri al
    await admin.auth.admin.deleteUser(created.user.id)
    return json({ error: 'insert_failed', detail: insErr.message }, 400)
  }

  // 5) denetim logu
  await admin.from('admin_audit_log').insert({
    admin_id: userData.user.id,
    action: 'create_admin',
    target_type: 'admin',
    target_id: created.user.id,
    detail: { email, full_name },
  })

  return json({ success: true, user_id: created.user.id })
})
