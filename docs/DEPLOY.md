# Deploy — Voca Tooki

Mimari iki parça:

- **Backend:** Supabase Cloud (Postgres + Auth + Edge Functions)
- **Frontend:** Cloudflare Pages (statik Vite SPA)

Gereksinimler: Supabase hesabı, Cloudflare hesabı, GitHub repo, yerelde
`supabase` CLI (`npx supabase`).

---

## A) Supabase Cloud (backend)

### 1. Proje oluştur
[supabase.com](https://supabase.com) → **New project**. Bölge (örn. `eu-central-1`)
ve güçlü bir **DB şifresi** belirle. Proje `ref`'ini not al (`Settings → General`).

### 2. Projeyi bağla ve migration'ları uygula
```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push          # migrations/0001–0013 remote'a uygulanır
```
> `db push` **seed.sql'i çalıştırmaz** — referans veri ve ilk admin aşağıda manuel.

### 3. Edge Function'ı deploy et
```bash
npx supabase functions deploy create-admin
```
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` cloud tarafından
otomatik enjekte edilir; ek env gerekmez.

### 4. Auth ayarları (Dashboard → Authentication)
- **Sign up:** `Allow new users to sign up` → **KAPALI** (yeni kayıt olmasın; admin yalnızca Edge Function ile oluşur).
- **Email provider:** açık kalmalı (e-posta ile giriş için).
- **URL Configuration → Site URL:** prod alan adın (örn. `https://kayit.okulunuz.com`).
  Redirect URLs'e de aynı alan adını ekle.

### 5. Referans veriyi ekle (SQL Editor)
`supabase/seed_reference.sql` içeriğini SQL Editor'de çalıştır (sınıf/dil listeleri).

### 6. İlk yöneticiyi oluştur (bootstrap)
create-admin fonksiyonu **mevcut bir admin** gerektirir; bu yüzden ilk admini elle kur:

1. Dashboard → **Authentication → Users → Add user** → e-posta + güçlü şifre (Auto-confirm açık).
2. SQL Editor'de yöneticiye ekle:
   ```sql
   insert into public.admins (user_id, full_name)
   select id, 'Ad Soyad'
   from auth.users
   where email = 'admin@okulunuz.com'
   on conflict (user_id) do nothing;
   ```
Sonraki yöneticileri panelden (Yöneticiler → Yönetici Ekle) oluşturabilirsin.

### 7. Bağlantı bilgileri
`Settings → API`'den **Project URL** ve **anon public key**'i al (frontend env için).
`service_role` anahtarını **asla** frontend'e koyma.

---

## B) Cloudflare Pages (frontend)

### 1. Repo'yu bağla
Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git** → repo'yu seç.

### 2. Build ayarları
- **Framework preset:** None (veya Vite)
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Environment variables (Production):**
  - `VITE_SUPABASE_URL` = `https://<PROJECT_REF>.supabase.co`
  - `VITE_SUPABASE_ANON_KEY` = anon public key
  - (Gerekirse) `NODE_VERSION` = `22`

SPA yönlendirmesi `public/_redirects` (`/* /index.html 200`) ile hazır — ekstra ayar gerekmez.

### 3. Deploy
Kaydet → ilk build otomatik başlar. Her `git push` → otomatik yeni deploy.

### 4. Özel alan adı
Pages → **Custom domains** → alan adını ekle (Cloudflare DNS ise otomatik, değilse CNAME).
HTTPS otomatik. Alan adını Supabase **Site URL**'iyle eşleştir (A/4).

---

## C) Deploy sonrası doğrulama

1. Prod frontend'i aç → ana sayfada aktivasyon kodu ekranı gelmeli.
2. `/admin/login` → ilk admin ile giriş yap. (Prod'da "Demo Admin ile Giriş" butonu
   **görünmez** — yalnızca `import.meta.env.DEV`'de.)
3. Kod üret → yeni sekmede kodu gir → öğrenci kaydını tamamla → panelde göründüğünü doğrula.
4. Konsol/Network'te hata olmamalı; RPC'ler 200 dönmeli.

---

## Güncelleme / yeniden deploy

- **Frontend:** `git push` → Cloudflare otomatik build+deploy.
- **DB değişikliği:** yeni migration yaz → `npx supabase db push`.
- **Edge Function:** `npx supabase functions deploy create-admin`.

## Notlar

- **Yedekleme:** Supabase günlük otomatik yedek alır (plan'a göre). Kritik veriler için
  düzenli manuel export da önerilir.
- **Rate limit IP'si** `X-Forwarded-For` son değerinden alınır; Supabase gateway bunu
  doğru set eder. Farklı proxy zinciri eklersen `client_ip()` (migration 0006/0010) gözden geçir.
- **Google Fonts** çalışma anında yüklenir (Plus Jakarta Sans). İstenirse ileride
  self-host edilebilir (gizlilik/çevrimdışı dayanıklılık).
- **KVKK retention:** `purge_registrations_older_than` RPC'sini panelden manuel ya da
  `pg_cron` ile zamanlanmış çalıştırabilirsin.
