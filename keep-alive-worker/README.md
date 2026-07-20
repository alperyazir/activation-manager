# Supabase Keep-Alive Worker

Supabase Free tier, 7 gün DB aktivitesi olmazsa projeyi duraklatır. Bu Cloudflare
Worker günde bir kez (06:00 UTC / 09:00 TR) Supabase'e gerçek bir `SELECT` sorgusu
atarak pause sayacını sıfırlar.

- **Bağımsız Worker'dır** — mevcut Cloudflare Pages sitesini etkilemez.
- Kullanılan anahtar **publishable/anon** (frontend'de zaten public), gizli değil.
- Cloudflare Workers **ücretsiz** planında cron dahildir; günde 1 istek kotayı zorlamaz.

## Deploy (tek seferlik)

```bash
cd keep-alive-worker
npx wrangler login      # tarayıcıda Cloudflare hesabına giriş (bir kez)
npx wrangler deploy     # Worker'ı + cron trigger'ı kurar
```

## Test

Deploy sonrası verilen `*.workers.dev` URL'sine tarayıcıdan gir → `OK: Supabase
aktif tutuldu.` görmelisin. Cron'u elle tetiklemek için:

```bash
npx wrangler dev --test-scheduled   # yerelde, sonra /__scheduled adresini çağır
```

## Ayarlar

- Çalışma saati / sıklık: `wrangler.toml` içindeki `crons` (UTC).
- Farklı proje: `wrangler.toml` içindeki `SUPABASE_URL` ve `SUPABASE_ANON_KEY`.
